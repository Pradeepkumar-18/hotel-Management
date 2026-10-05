import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { PermissionSchema, RoleSchema } from './schemas/role.schema';
import { StaffMembershipSchema } from './schemas/staff-membership.schema';
import { UserSchema } from './schemas/user.schema';

const CATALOG_PERMISSIONS = [
  'hotels.view', 'hotels.create', 'hotels.edit', 'hotels.publish', 'hotels.archive',
  'room_types.view', 'room_types.create', 'room_types.edit', 'room_types.archive',
  'inventory.view', 'inventory.block', 'inventory.adjust',
  'rates.view', 'rates.edit',
];

async function seedSuperAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const mongoUri = process.env.MONGODB_URI;
  if (!email || !password || !mongoUri) {
    throw new Error('Set BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD, and MONGODB_URI before running this command');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('BOOTSTRAP_ADMIN_EMAIL must be a valid email address');
  if (password.length < 12 || password.length > 128) throw new Error('Bootstrap password must be 12 to 128 characters');

  await mongoose.connect(mongoUri);
  try {
    const User = mongoose.model('User', UserSchema);
    const Role = mongoose.model('Role', RoleSchema);
    const Permission = mongoose.model('Permission', PermissionSchema);
    const StaffMembership = mongoose.model('StaffMembership', StaffMembershipSchema);

    for (const key of CATALOG_PERMISSIONS) {
      const domain = key.split('.')[0];
      await Permission.updateOne(
        { key },
        { $setOnInsert: { key, domain, description: `${key} permission`, version: 1 } },
        { upsert: true },
      );
    }

    const role = await Role.findOneAndUpdate(
      { key: 'SUPER_ADMIN' },
      { $set: { key: 'SUPER_ADMIN', name: 'Super Administrator', permissionKeys: CATALOG_PERMISSIONS, system: true, active: true, version: 2 } },
      { upsert: true, new: true },
    );
    const existingUser = await User.findOne({ normalizedEmail: email });
    if (existingUser) throw new Error('That email already exists; bootstrap updates code-owned permissions but does not reset credentials');
    const user = await User.create({
      normalizedEmail: email,
      passwordHash: await bcrypt.hash(password, 12),
      accountType: 'STAFF',
      status: 'ACTIVE',
      failedLoginCount: 0,
    });
    await StaffMembership.create({ userId: user._id, roleIds: [role._id], hotelIds: [], status: 'ACTIVE' });
    process.stdout.write(`Created initial super-admin staff account: ${email}\n`);
  } finally {
    await mongoose.disconnect();
  }
}

seedSuperAdmin().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
