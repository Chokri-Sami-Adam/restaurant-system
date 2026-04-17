import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import AdminOrders from './pages/AdminOrders';
import Stock from './pages/Stock';
import Products from './pages/Products';
import Ingredients from './pages/Ingredients';
import Payments from './pages/Payments';
import Users from './pages/Users';
import WaiterOrders from './pages/WaiterOrders';
import Kitchen from './pages/Kitchen';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import SystemSettings from './pages/SystemSettings';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import AppErrorBoundary from './components/AppErrorBoundary';

function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Admin + Manager */}
          <Route index element={<RoleRoute allowedRoles={['admin', 'manager']}><Dashboard /></RoleRoute>} />
          <Route path="orders" element={<RoleRoute allowedRoles={['admin', 'manager']}><Orders /></RoleRoute>} />
          <Route path="admin-orders" element={<RoleRoute allowedRoles={['admin', 'manager']}><AdminOrders /></RoleRoute>} />
          <Route path="products" element={<RoleRoute allowedRoles={['admin', 'manager']}><Products /></RoleRoute>} />
          <Route path="ingredients" element={<RoleRoute allowedRoles={['admin', 'manager']}><Ingredients /></RoleRoute>} />
          <Route path="stock" element={<RoleRoute allowedRoles={['admin', 'manager']}><Stock /></RoleRoute>} />

          {/* Admin only */}
          <Route path="users" element={<RoleRoute allowedRoles={['admin']}><Users /></RoleRoute>} />
          <Route path="analytics" element={<RoleRoute allowedRoles={['admin']}><Analytics /></RoleRoute>} />
          <Route path="reports" element={<RoleRoute allowedRoles={['admin']}><Reports /></RoleRoute>} />
          <Route path="settings" element={<RoleRoute allowedRoles={['admin']}><SystemSettings /></RoleRoute>} />

          {/* Serveur */}
          <Route path="waiter" element={<RoleRoute allowedRoles={['serveur']}><WaiterOrders /></RoleRoute>} />

          {/* Admin + Manager + Caissier */}
          <Route path="payments" element={<RoleRoute allowedRoles={['admin', 'manager', 'caissier']}><Payments /></RoleRoute>} />

          {/* Cuisine */}
          <Route path="kitchen" element={<RoleRoute allowedRoles={['cuisine']}><Kitchen /></RoleRoute>} />
        </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;
