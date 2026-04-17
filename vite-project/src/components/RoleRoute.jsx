import { Navigate } from 'react-router-dom';

const RoleRoute = ({ allowedRoles, children }) => {
  const role = localStorage.getItem('role') || 'admin';

  if (!allowedRoles.includes(role)) {
    // Redirect each role to their default page
    const defaultPage = {
      admin: '/',
      manager: '/',
      serveur: '/waiter',
      caissier: '/payments',
      cuisine: '/kitchen',
    };
    return <Navigate to={defaultPage[role] || '/login'} replace />;
  }

  return children;
};

export default RoleRoute;
