import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Dashboard } from "../pages/Dashboard";
import { Login } from "../pages/Login";
import { Departments } from "../pages/organization/Departments";
import { Designations } from "../pages/organization/Designations";
import { Categories } from "../pages/catalog/Categories";
import { CategoryForm } from "../pages/catalog/CategoryForm";
import { SubCategories } from "../pages/catalog/SubCategories";
import { SubCategoryForm } from "../pages/catalog/SubCategoryForm";
import { Products } from "../pages/business/Products";
import { ProductForm } from "../pages/business/ProductForm";
import { ProductView } from "../pages/business/ProductView";
import { Employees } from "../pages/management/Employees";
import { EmployeeForm } from "../pages/management/EmployeeForm";
import { Leads } from "../pages/management/Leads";
import { LeadForm } from "../pages/management/LeadForm";
import { LeadOrders } from "../pages/management/LeadOrders";
import { PushOrderPage } from "../pages/management/PushOrderPage";
import { FollowUps } from "../pages/management/FollowUps";
import { LeadView } from "../pages/management/LeadView";
import { Permissions } from "../pages/management/Permissions";
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

        {/* Organization Routes */}
        <Route path="departments" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["MANAGE_DEPARTMENTS"]}><Departments /></RoleRoute>} />
        <Route path="designations" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["MANAGE_DESIGNATIONS"]}><Designations /></RoleRoute>} />
        <Route path="permissions" element={<RoleRoute allowedRoles={["ADMIN"]} permissionsNeeded={["MANAGE_PERMISSIONS"]}><Permissions /></RoleRoute>} />

        {/* Management Routes */}
        <Route path="customers" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_CUSTOMERS"]}><div className="p-4">Customers Page Placeholder</div></RoleRoute>} />
        <Route path="employees" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_EMPLOYEES"]}><Employees /></RoleRoute>} />
        <Route path="employees/create" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_EMPLOYEES"]}><EmployeeForm /></RoleRoute>} />
        <Route path="employees/edit/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_EMPLOYEES"]}><EmployeeForm /></RoleRoute>} />
        
        <Route path="leads" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["VIEW_LEADS"]}><Leads /></RoleRoute>} />
        <Route path="leads/create" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["CREATE_LEADS"]}><LeadForm /></RoleRoute>} />
        <Route path="leads/edit/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["EDIT_LEADS"]}><LeadForm /></RoleRoute>} />
        <Route path="leads/view/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["VIEW_LEADS"]}><LeadView /></RoleRoute>} />
        <Route path="leads/push-order/:leadId" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["CREATE_LEAD_ORDERS"]}><PushOrderPage /></RoleRoute>} />
        <Route path="lead-orders" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["VIEW_LEAD_ORDERS"]}><LeadOrders /></RoleRoute>} />
        <Route path="follow-ups" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["VIEW_FOLLOWUPS"]}><FollowUps /></RoleRoute>} />

        <Route path="orders" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "VENDOR"]} permissionsNeeded={["VIEW_ORDERS"]}><div className="p-4">Orders Page Placeholder</div></RoleRoute>} />

        {/* Catalog Routes */}
        <Route path="categories" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_CATEGORIES"]}><Categories /></RoleRoute>} />
        <Route path="categories/create" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_CATEGORIES"]}><CategoryForm /></RoleRoute>} />
        <Route path="categories/edit/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_CATEGORIES"]}><CategoryForm /></RoleRoute>} />
        
        <Route path="subcategories" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_SUBCATEGORIES"]}><SubCategories /></RoleRoute>} />
        <Route path="subcategories/create" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_SUBCATEGORIES"]}><SubCategoryForm /></RoleRoute>} />
        <Route path="subcategories/edit/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_SUBCATEGORIES"]}><SubCategoryForm /></RoleRoute>} />
        
        {/* Business Routes */}
        <Route path="products" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "VENDOR"]} permissionsNeeded={["VIEW_PRODUCTS"]}><Products /></RoleRoute>} />
        <Route path="products/create" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "VENDOR"]} permissionsNeeded={["VIEW_PRODUCTS"]}><ProductForm /></RoleRoute>} />
        <Route path="products/edit/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "VENDOR"]} permissionsNeeded={["VIEW_PRODUCTS"]}><ProductForm /></RoleRoute>} />
        <Route path="products/view/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "VENDOR"]} permissionsNeeded={["VIEW_PRODUCTS"]}><ProductView /></RoleRoute>} />
        
        <Route path="inventory" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_INVENTORY"]}><div className="p-4">Inventory Page Placeholder</div></RoleRoute>} />

        {/* Settings Route */}
        <Route path="settings" element={<RoleRoute allowedRoles={["ADMIN"]}><div className="p-4">Settings Page Placeholder</div></RoleRoute>} />

        <Route path="*" element={<div className="p-4">404 Not Found</div>} />
      </Route>
    </Routes>
  );
};
