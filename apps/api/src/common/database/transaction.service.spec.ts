import { ClientSession, Connection } from 'mongoose';
import { TransactionService } from './transaction.service';

function connectionMock(setName?: string) {
  const session = { endSession: jest.fn(), withTransaction: jest.fn() } as unknown as ClientSession;
  const connection = {
    db: { admin: () => ({ command: jest.fn().mockResolvedValue({ ok: 1, setName, isWritablePrimary: true }) }) },
    startSession: jest.fn().mockResolvedValue(session),
  } as unknown as Connection;
  return { connection, session };
}

describe('TransactionService standalone development mode', () => {
  it('runs local writes without starting a transaction on standalone MongoDB', async () => {
    const { connection, session } = connectionMock();
    const service = new TransactionService(connection, 'development');
    const operation = jest.fn().mockResolvedValue('saved');

    await expect(service.executeInTransaction(operation)).resolves.toBe('saved');
    expect(operation).toHaveBeenCalledWith(session);
    expect(session.withTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it('rejects standalone MongoDB outside local development', async () => {
    const { connection, session } = connectionMock();
    const service = new TransactionService(connection, 'production');
    const operation = jest.fn();

    await expect(service.executeInTransaction(operation)).rejects.toThrow('replica-set topology is required');
    expect(operation).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it('keeps using a real transaction when replica-set topology is detected', async () => {
    const { connection, session } = connectionMock('rs0');
    const result = { withTransaction: jest.fn(async (work: () => Promise<void>) => work()) };
    (session as any).withTransaction = result.withTransaction;
    const service = new TransactionService(connection, 'development');
    const operation = jest.fn().mockResolvedValue('saved');

    await expect(service.executeInTransaction(operation)).resolves.toBe('saved');
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledWith(session);
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });
});
