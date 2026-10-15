import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const API_BASE = 'http://localhost:3000/api/v1';

let failedAssertions = 0;

function assertCase(
  name: string,
  actualStatus: number,
  expectedStatus: number | number[],
  actualCode?: string,
  expectedCode?: string | string[],
) {
  const allowedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  if (!allowedStatuses.includes(actualStatus)) {
    console.error(`❌ [FAIL] ${name}: Expected status ${allowedStatuses.join(' or ')}, got ${actualStatus}`);
    failedAssertions++;
    return;
  }
  if (expectedCode !== undefined) {
    const allowedCodes = Array.isArray(expectedCode) ? expectedCode : [expectedCode];
    if (!actualCode || !allowedCodes.includes(actualCode)) {
      console.error(`❌ [FAIL] ${name}: Expected errorCode ${allowedCodes.join(' or ')}, got ${actualCode}`);
      failedAssertions++;
      return;
    }
  }
  console.log(`✅ [PASS] ${name}: Status ${actualStatus}, errorCode ${actualCode || 'OK'}`);
}

async function main() {
  console.log('--- STARTING SCENARIO VERIFICATION ---');

  // Step 0: Login as super admin to get cookie and CSRF
  const loginRes = await fetch(`${API_BASE}/auth/staff/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: 'test12345@gmail.com', password: 'TestPassword@12345' }),
  });

  const rawCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie') || ''];
  const cookies = rawCookies.map(c => c.split(';')[0]).join('; ');
  const csrfMatch = cookies.match(/staywise_staff_csrf=([^;]+)/);
  const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1]) : '';

  const authHeaders = {
    'Content-Type': 'application/json',
    Origin: 'http://localhost:5173',
    Cookie: cookies,
    'x-csrf-token': csrfToken,
  };

  // -------------------------------------------------------------
  // Scenario i: POST without x-csrf-token -> 401 or 403 CSRF_REJECTED
  // -------------------------------------------------------------
  console.log('\n[Scenario i] POST without x-csrf-token');
  const resI = await fetch(`${API_BASE}/admin/hotels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:5173',
      Cookie: cookies,
      // no x-csrf-token
    },
    body: JSON.stringify({ name: 'CSRF Test' }),
  });
  const jsonI = await resI.json();
  assertCase('Scenario i: Missing CSRF token rejected', resI.status, [401, 403], jsonI.errorCode, 'CSRF_REJECTED');

  // -------------------------------------------------------------
  // Scenario f: Create hotel with empty name and bad email -> 400 VALIDATION_FAILED
  // -------------------------------------------------------------
  console.log('\n[Scenario f] Create hotel with empty name and bad email');
  const resF = await fetch(`${API_BASE}/admin/hotels`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: '',
      slug: 'valid-slug',
      timezone: 'Asia/Kolkata',
      address: { city: 'Bengaluru', countryCode: 'IN', line1: '123 Main', postalCode: '560001' },
      contact: { email: 'not-an-email' },
    }),
  });
  const jsonF = await resF.json();
  assertCase('Scenario f: Validation failure dot-paths', resF.status, 400, jsonF.errorCode, 'VALIDATION_FAILED');

  // Create a valid draft hotel for subsequent tests
  const hotelCreateRes = await fetch(`${API_BASE}/admin/hotels`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Verification Test Hotel ' + Date.now(),
      slug: 'test-hotel-' + Date.now(),
      timezone: 'Asia/Kolkata',
      address: { city: 'Bengaluru', countryCode: 'IN', line1: '123 Test St', postalCode: '560001' },
      contact: { email: 'test@hotel.com' },
    }),
  });
  const hotelA = await hotelCreateRes.json();
  const hotelAId = hotelA._id;

  // -------------------------------------------------------------
  // Scenario g: Publish an unready hotel -> 409 HOTEL_NOT_READY
  // -------------------------------------------------------------
  console.log('\n[Scenario g] Publish an unready hotel');
  const resG = await fetch(`${API_BASE}/admin/hotels/${hotelAId}/publish`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ version: hotelA.version }),
  });
  const jsonG = await resG.json();
  assertCase('Scenario g: Publish unready hotel blocked', resG.status, 409, jsonG.errorCode, 'HOTEL_NOT_READY');

  // -------------------------------------------------------------
  // Scenario a: Bulk status PUBLISHED on a DRAFT hotel -> skipped INVALID_TRANSITION
  // -------------------------------------------------------------
  console.log('\n[Scenario a] Bulk status PUBLISHED on a DRAFT hotel');
  const resA = await fetch(`${API_BASE}/admin/hotels/bulk-status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      hotelIds: [hotelAId],
      status: 'PUBLISHED',
      reason: 'Bulk publish test',
    }),
  });
  const jsonA = await resA.json();
  const hasInvalidTransition = Array.isArray(jsonA.skipped) && jsonA.skipped.some((s: any) => s.code === 'INVALID_TRANSITION' || s.reason === 'INVALID_TRANSITION');
  assertCase('Scenario a: Bulk publish draft hotel skipped', resA.status, 200);
  if (!hasInvalidTransition) {
    console.error('❌ [FAIL] Scenario a: Expected skipped array to contain code INVALID_TRANSITION');
    failedAssertions++;
  } else {
    console.log('✅ [PASS] Scenario a: Successfully rejected invalid draft transition');
  }

  // -------------------------------------------------------------
  // Scenario e: Create room type with duplicate code -> 409 DUPLICATE
  // -------------------------------------------------------------
  console.log('\n[Scenario e] Create room type with a duplicate code');
  const code = 'DUP-' + Date.now().toString().slice(-4);
  const room1Res = await fetch(`${API_BASE}/admin/hotels/${hotelAId}/room-types`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Deluxe Room', code, maxAdults: 2, maxChildren: 1, totalRooms: 5 }),
  });
  const room1 = await room1Res.json();
  const room1Id = room1._id;

  const resE = await fetch(`${API_BASE}/admin/hotels/${hotelAId}/room-types`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Deluxe Room 2', code, maxAdults: 2, maxChildren: 1, totalRooms: 5 }),
  });
  const jsonE = await resE.json();
  assertCase('Scenario e: Duplicate room code conflict', resE.status, 409, jsonE.errorCode, 'DUPLICATE');

  // -------------------------------------------------------------
  // Scenario h: PUT base-rate with a stale version -> 409 VERSION_CONFLICT
  // -------------------------------------------------------------
  console.log('\n[Scenario h] PUT base-rate with a stale version');
  await fetch(`${API_BASE}/admin/room-types/${room1Id}/base-rate`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ amountMinorUnits: 15000, currency: 'INR', reason: 'Initial rate setup' }),
  });

  const resH = await fetch(`${API_BASE}/admin/room-types/${room1Id}/base-rate`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ amountMinorUnits: 18000, currency: 'INR', version: 999, reason: 'Stale update' }),
  });
  const jsonH = await resH.json();
  assertCase('Scenario h: Stale version conflict on rate', resH.status, 409, jsonH.errorCode, 'VERSION_CONFLICT');

  // -------------------------------------------------------------
  // Scenario b: Bulk status on an ARCHIVED hotel -> skipped INVALID_TRANSITION
  // -------------------------------------------------------------
  console.log('\n[Scenario b] Bulk status on an ARCHIVED hotel');
  const freshHotelRes = await fetch(`${API_BASE}/admin/hotels/${hotelAId}`, { headers: authHeaders });
  const freshHotel = await freshHotelRes.json();
  await fetch(`${API_BASE}/admin/hotels/${hotelAId}/archive`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ version: freshHotel.version, reason: 'Test archive' }),
  });

  const resB = await fetch(`${API_BASE}/admin/hotels/bulk-status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      hotelIds: [hotelAId],
      status: 'SUSPENDED',
      reason: 'Attempt reviving archived',
    }),
  });
  const jsonB = await resB.json();
  const hasArchivedSkip = Array.isArray(jsonB.skipped) && jsonB.skipped.some((s: any) => s.code === 'INVALID_TRANSITION' || s.code === 'ARCHIVED');
  assertCase('Scenario b: Bulk status on archived skipped', resB.status, 200);
  if (!hasArchivedSkip) {
    console.error('❌ [FAIL] Scenario b: Expected skipped array to contain invalid transition for archived hotel');
    failedAssertions++;
  } else {
    console.log('✅ [PASS] Scenario b: Successfully skipped archived hotel');
  }

  // Connect to DB directly for creating scoped staff / checking users
  await mongoose.connect(process.env.MONGODB_URI!);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const Role = mongoose.model('Role', new mongoose.Schema({}, { strict: false }), 'roles');
  const StaffMembership = mongoose.model('StaffMembership', new mongoose.Schema({}, { strict: false }), 'staff_memberships');

  // -------------------------------------------------------------
  // Scenario c: Bulk ARCHIVED with a user lacking hotels.archive -> 403 FORBIDDEN
  // -------------------------------------------------------------
  console.log('\n[Scenario c] Bulk ARCHIVED with a user lacking hotels.archive');
  const editOnlyRole = await Role.findOneAndUpdate(
    { key: 'TEST_HOTELS_EDIT_ONLY' },
    { $set: { key: 'TEST_HOTELS_EDIT_ONLY', name: 'Editor', permissionKeys: ['hotels.view', 'hotels.edit'], system: false, active: true } },
    { upsert: true, new: true }
  );

  const editorEmail = `editor_${Date.now()}@test.com`;
  const editorUser = await User.create({
    normalizedEmail: editorEmail,
    passwordHash: await bcrypt.hash('TestPassword@12345', 10),
    accountType: 'STAFF',
    status: 'ACTIVE',
    failedLoginCount: 0,
  });
  await StaffMembership.create({ userId: editorUser._id, roleIds: [editOnlyRole._id], hotelIds: [], status: 'ACTIVE' });

  const editorLoginRes = await fetch(`${API_BASE}/auth/staff/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: editorEmail, password: 'TestPassword@12345' }),
  });
  const rawEditorCookies = editorLoginRes.headers.getSetCookie ? editorLoginRes.headers.getSetCookie() : [editorLoginRes.headers.get('set-cookie') || ''];
  const editorCookies = rawEditorCookies.map(c => c.split(';')[0]).join('; ');
  const editorCsrf = decodeURIComponent(editorCookies.match(/staywise_staff_csrf=([^;]+)/)?.[1] || '');

  const resC = await fetch(`${API_BASE}/admin/hotels/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:5173',
      Cookie: editorCookies,
      'x-csrf-token': editorCsrf,
    },
    body: JSON.stringify({
      hotelIds: [hotelAId],
      status: 'ARCHIVED',
      reason: 'Unauthorized archive attempt',
    }),
  });
  const jsonC = await resC.json();
  assertCase('Scenario c: Forbidden archive without permission', resC.status, 403, jsonC.errorCode, 'FORBIDDEN');

  // -------------------------------------------------------------
  // Scenario d: Manager scoped to hotel A accessing hotel B -> all 403 FORBIDDEN
  // -------------------------------------------------------------
  console.log('\n[Scenario d] Manager scoped to hotel A accessing hotel B');
  const hotelBRes = await fetch(`${API_BASE}/admin/hotels`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Hotel B ' + Date.now(),
      slug: 'hotel-b-' + Date.now(),
      timezone: 'Asia/Kolkata',
      address: { city: 'Mumbai', countryCode: 'IN', line1: '456 Marine Dr', postalCode: '400001' },
      contact: { email: 'hotelb@test.com' },
    }),
  });
  const hotelB = await hotelBRes.json();
  const hotelBId = hotelB._id;

  const roomBRes = await fetch(`${API_BASE}/admin/hotels/${hotelBId}/room-types`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'B Deluxe', code: 'BDELUXE', maxAdults: 2, maxChildren: 0, totalRooms: 4 }),
  });
  const roomB = await roomBRes.json();
  const roomBId = roomB._id;

  const mgrRole = await Role.findOneAndUpdate(
    { key: 'TEST_MANAGER' },
    { $set: { key: 'TEST_MANAGER', name: 'Manager', permissionKeys: ['hotels.view', 'room_types.view', 'inventory.view', 'rates.view'], system: false, active: true } },
    { upsert: true, new: true }
  );

  const mgrEmail = `mgr_${Date.now()}@test.com`;
  const mgrUser = await User.create({
    normalizedEmail: mgrEmail,
    passwordHash: await bcrypt.hash('TestPassword@12345', 12),
    accountType: 'STAFF',
    status: 'ACTIVE',
    failedLoginCount: 0,
  });
  await StaffMembership.create({ userId: mgrUser._id, roleIds: [mgrRole._id], hotelIds: [new mongoose.Types.ObjectId(hotelAId)], status: 'ACTIVE' });

  const mgrLoginRes = await fetch(`${API_BASE}/auth/staff/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
    body: JSON.stringify({ email: mgrEmail, password: 'TestPassword@12345' }),
  });
  const rawMgrCookies = mgrLoginRes.headers.getSetCookie ? mgrLoginRes.headers.getSetCookie() : [mgrLoginRes.headers.get('set-cookie') || ''];
  const mgrCookies = rawMgrCookies.map(c => c.split(';')[0]).join('; ');
  const mgrHeaders = { Origin: 'http://localhost:5173', Cookie: mgrCookies };

  const d1 = await fetch(`${API_BASE}/admin/hotels/${hotelBId}`, { headers: mgrHeaders });
  const d2 = await fetch(`${API_BASE}/admin/hotels/${hotelBId}/room-types`, { headers: mgrHeaders });
  const d3 = await fetch(`${API_BASE}/admin/room-types/${roomBId}/inventory?from=2026-10-15&to=2026-10-20`, { headers: mgrHeaders });
  const d4 = await fetch(`${API_BASE}/admin/room-types/${roomBId}/base-rate`, { headers: mgrHeaders });

  const j1 = await d1.json();
  const j2 = await d2.json();
  const j3 = await d3.json();
  const j4 = await d4.json();

  assertCase('Scenario d1: Out-of-scope hotel access', d1.status, 403, j1.errorCode, 'FORBIDDEN');
  assertCase('Scenario d2: Out-of-scope room types access', d2.status, 403, j2.errorCode, 'FORBIDDEN');
  assertCase('Scenario d3: Out-of-scope inventory access', d3.status, 403, j3.errorCode, 'FORBIDDEN');
  assertCase('Scenario d4: Out-of-scope rates access', d4.status, 403, j4.errorCode, 'FORBIDDEN');

  // -------------------------------------------------------------
  // Scenario j: 6 wrong passwords -> ACCOUNT_LOCKED / 429 TOO_MANY_ATTEMPTS with Retry-After header
  // -------------------------------------------------------------
  console.log('\n[Scenario j] 6 wrong passwords on account');
  const victimEmail = `lockout_${Date.now()}@test.com`;
  await User.create({
    normalizedEmail: victimEmail,
    passwordHash: await bcrypt.hash('CorrectPass@12345', 10),
    accountType: 'STAFF',
    status: 'ACTIVE',
    failedLoginCount: 0,
  });

  for (let i = 1; i <= 6; i++) {
    const wrongRes = await fetch(`${API_BASE}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ email: victimEmail, password: 'WrongPassword@999' }),
    });
    const body = await wrongRes.json();
    if (i <= 5) {
      assertCase(`Scenario j (attempt ${i}): Invalid credentials`, wrongRes.status, 401, body.errorCode, 'AUTH_INVALID_CREDENTIALS');
    } else {
      assertCase(`Scenario j (attempt ${i}): Locked account / Rate limited`, wrongRes.status, 429, body.errorCode, ['ACCOUNT_LOCKED', 'TOO_MANY_ATTEMPTS']);
      const retryAfter = wrongRes.headers.get('retry-after');
      if (!retryAfter) {
        console.error('❌ [FAIL] Scenario j: 429 missing Retry-After header');
        failedAssertions++;
      } else {
        console.log(`✅ [PASS] Scenario j: Retry-After header set to ${retryAfter}`);
      }
    }
  }

  await mongoose.disconnect();

  if (failedAssertions > 0) {
    console.error(`\n❌ VERIFICATION FAILED: ${failedAssertions} assertion(s) failed.`);
    process.exit(1);
  }

  console.log('\n--- SCENARIO VERIFICATION FINISHED: ALL TESTS PASSED ---');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
