import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Dashboard } from "../pages/Dashboard";
import { Login } from "../pages/Login";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { token, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>; // Prevent flash of login on refresh

  const isAuthenticated = token && token !== "undefined" && token !== "null" && token !== "";
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const AuthRoute = ({ children }) => {
  const { token, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;

  const isAuthenticated = token && token !== "undefined" && token !== "null" && token !== "";
  // If user is already logged in, redirect them to dashboard
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const RoleRoute = ({ children, allowedRoles = [], permissionsNeeded = [] }) => {
  const { hasRole, hasPermission, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;

  const roleAllowed = allowedRoles.length === 0 || hasRole(allowedRoles);
  const permissionAllowed = permissionsNeeded.length === 0 || hasPermission(permissionsNeeded);

  if (!roleAllowed || !permissionAllowed) {
    // Ideally redirect to a generic page or a 403 Access Denied page
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthRoute><Login /></AuthRoute>} />

      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        
        {/* Management Routes */}
        <Route path="customers" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_CUSTOMERS"]}><div className="p-4">Customers Page Placeholder</div></RoleRoute>} />
        <Route path="employees" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_EMPLOYEES"]}><div className="p-4">Employees Page Placeholder</div></RoleRoute>} />
        <Route path="orders" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "VENDOR"]} permissionsNeeded={["VIEW_ORDERS"]}><div className="p-4">Orders Page Placeholder</div></RoleRoute>} />

        {/* Business Routes */}
        <Route path="products" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "VENDOR"]} permissionsNeeded={["VIEW_PRODUCTS"]}><div className="p-4">Products Page Placeholder</div></RoleRoute>} />
        <Route path="categories" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_CATEGORIES"]}><div className="p-4">Categories Page Placeholder</div></RoleRoute>} />
        <Route path="inventory" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_INVENTORY"]}><div className="p-4">Inventory Page Placeholder</div></RoleRoute>} />
        
        {/* Settings Route */}
        <Route path="settings" element={<RoleRoute allowedRoles={["ADMIN"]}><div className="p-4">Settings Page Placeholder</div></RoleRoute>} />
        
        <Route path="*" element={<div className="p-4">404 Not Found</div>} />
      </Route>
    </Routes>
  );
};
