import { Navigate, Route, Routes } from 'react-router-dom';
import { StaffMe } from '../api';
import { homePath } from './route-config';
import { PermissionRoute } from './PermissionRoute';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { HotelsPage } from '../pages/hotels/HotelsPage';
import { RoomTypesPage } from '../pages/catalog/RoomTypesPage';
import { InventoryPage } from '../pages/catalog/InventoryPage';
import { RatesPage } from '../pages/catalog/RatesPage';
import { AccessPage } from '../pages/error/AccessPage';

export function AppRoutes({ staff }: { staff: StaffMe }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={homePath(staff)} replace />} />
      <Route path="/admin" element={<Navigate to={homePath(staff)} replace />} />
      <Route path="/admin/login" element={<Navigate to={homePath(staff)} replace />} />
      <Route path="/admin/unauthorized" element={<AccessPage kind="unauthorized" home={homePath(staff)} />} />
      <Route
        path="/admin/dashboard"
        element={
          <PermissionRoute staff={staff} path="/admin/dashboard">
            <DashboardPage staff={staff} />
          </PermissionRoute>
        }
      />
      <Route
        path="/admin/hotels"
        element={
          <PermissionRoute staff={staff} path="/admin/hotels">
            <HotelsPage staff={staff} />
          </PermissionRoute>
        }
      />
      <Route
        path="/admin/room-types"
        element={
          <PermissionRoute staff={staff} path="/admin/room-types">
            <RoomTypesPage staff={staff} />
          </PermissionRoute>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <PermissionRoute staff={staff} path="/admin/inventory">
            <InventoryPage staff={staff} />
          </PermissionRoute>
        }
      />
      <Route
        path="/admin/rates"
        element={
          <PermissionRoute staff={staff} path="/admin/rates">
            <RatesPage staff={staff} />
          </PermissionRoute>
        }
      />
      <Route path="*" element={<AccessPage kind="not-found" home={homePath(staff)} />} />
    </Routes>
  );
}
