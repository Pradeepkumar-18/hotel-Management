import React from 'react';
import { StaffMe } from '../api';
import { homePath, routePermissions } from './route-config';
import { AccessPage } from '../pages/error/AccessPage';

export function PermissionRoute({ staff, path, children }: { staff: StaffMe; path: string; children: React.ReactNode }) {
  const permission = routePermissions[path];
  return permission && !staff.permissions.includes(permission) ? (
    <AccessPage kind="unauthorized" home={homePath(staff)} />
  ) : (
    <>{children}</>
  );
}
