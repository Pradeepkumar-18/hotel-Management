import React from 'react';
import { useAuth } from './AuthContext';

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { can } = useAuth();
  return <>{can(permission) ? children : fallback}</>;
}
