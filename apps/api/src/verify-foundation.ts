import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { TransactionService } from './common/database/transaction.service';

async function verifyFoundation() {
  console.log('--- Staywise Phase 0: Verification of MongoDB Replica Set Transactions ---');

  let replSet: MongoMemoryReplSet | null = null;
  let uri = process.env.MONGODB_URI;

  // If standard URI is not a configured replica set or unavailable, boot in-memory replica set
  try {
    if (!uri || !uri.includes('replicaSet')) {
      console.log('Setting up in-memory MongoDB Replica Set for verification...');
      replSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, name: 'rs0' },
      });
      uri = replSet.getUri();
      console.log(`Development replica set started at: ${uri}`);
    }

    console.log(`Connecting to MongoDB at: ${uri}`);
    await mongoose.connect(uri);

    const txService = new TransactionService(mongoose.connection);
    const isReplica = await txService.isReplicaSet();
    console.log(`Replica set topology active: ${isReplica}`);

    if (!isReplica) {
      throw new Error('MongoDB instance is not running as a replica set! Transactions require replica set.');
    }

    // Define a test collection schema
    const testSchema = new mongoose.Schema({
      key: { type: String, required: true, unique: true },
      value: { type: Number, required: true },
    });
    const TestModel = mongoose.model('FoundationTest', testSchema);
    await TestModel.init(); // ensure indexes

    console.log('Testing successful multi-document transaction commit...');
    await txService.executeInTransaction(async (session) => {
      await TestModel.create([{ key: 'tx_key_1', value: 100 }], { session });
      await TestModel.create([{ key: 'tx_key_2', value: 200 }], { session });
    });

    const doc1 = await TestModel.findOne({ key: 'tx_key_1' });
    const doc2 = await TestModel.findOne({ key: 'tx_key_2' });
    if (!doc1 || !doc2) {
      throw new Error('Transaction commit failed: documents not persisted!');
    }
    console.log('Transaction commit test: PASSED (both documents persisted atomically)');

    console.log('Testing multi-document transaction rollback on error...');
    let threwError = false;
    try {
      await txService.executeInTransaction(async (session) => {
        await TestModel.create([{ key: 'tx_rollback_1', value: 300 }], { session });
        // deliberate abort
        throw new Error('Deliberate transaction failure to test rollback');
      });
    } catch (err: any) {
      threwError = true;
      console.log(`Caught expected transaction error: ${err.message}`);
    }

    if (!threwError) {
      throw new Error('Transaction did not abort as expected!');
    }

    const rollbackDoc = await TestModel.findOne({ key: 'tx_rollback_1' });
    if (rollbackDoc) {
      throw new Error('Rollback failed: document should not exist after aborted transaction!');
    }
    console.log('Transaction rollback test: PASSED (no partial data written)');

    console.log('--- ALL FOUNDATION CHECKS PASSED SUCCESSFULLY ---');
  } finally {
    await mongoose.disconnect();
    if (replSet) {
      await replSet.stop();
    }
  }
}

verifyFoundation().catch((err) => {
  console.error('Foundation verification failed:', err);
  process.exit(1);
});
