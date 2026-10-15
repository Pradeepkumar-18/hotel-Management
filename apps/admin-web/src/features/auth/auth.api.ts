import { request, setCsrfToken, StaffMe } from '../../api';

export async function loginStaff(payload: { email: string; password: string }) {
  const login = await request<{ csrfToken: string }>('/auth/staff/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setCsrfToken(login.csrfToken);
  return login;
}

export function getStaffMe(signal?: AbortSignal) {
  return request<StaffMe>('/auth/me', { signal });
}

export function logoutStaff() {
  return request('/auth/logout', { method: 'POST' });
}

export function logoutAllStaff() {
  return request('/auth/logout-all', { method: 'POST' });
}
