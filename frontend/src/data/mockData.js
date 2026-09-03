import {
  LayoutDashboard,
  Users,
  Building2,
  ShoppingCart,
  Package,
  Tags,
  Boxes,
  Warehouse,
  CreditCard,
  Banknote,
  Wallet,
  FileBarChart,
  Bell,
  Settings,
  Building,
  Briefcase,
} from "lucide-react";

export const navigationData = [
  {
    group: "Dashboard",
    items: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard, allowedRoles: ["ADMIN", "EMPLOYEE", "VENDOR"] },
    ],
  },
  {
    group: "Organization",
    items: [
      { name: "Departments", href: "/dashboard/departments", icon: Building, allowedRoles: ["ADMIN"] },
      { name: "Designations", href: "/dashboard/designations", icon: Briefcase, allowedRoles: ["ADMIN"] },
    ],
  },
  {
    group: "Management",
    items: [
      { name: "Customers", href: "/dashboard/customers", icon: Users, allowedRoles: ["ADMIN", "EMPLOYEE"], permissionsNeeded: ["VIEW_CUSTOMERS"] },
      { name: "Employees", href: "/dashboard/employees", icon: Building2, allowedRoles: ["ADMIN", "EMPLOYEE"], permissionsNeeded: ["VIEW_EMPLOYEES"] },
      { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart, allowedRoles: ["ADMIN", "EMPLOYEE", "VENDOR"], permissionsNeeded: ["VIEW_ORDERS"] },
    ],
  },
  {
    group: "Catalog",
    items: [
      { name: "Categories", href: "/dashboard/categories", icon: Tags, allowedRoles: ["ADMIN", "EMPLOYEE"], permissionsNeeded: ["VIEW_CATEGORIES"] },
      { name: "SubCategories", href: "/dashboard/subcategories", icon: Boxes, allowedRoles: ["ADMIN", "EMPLOYEE"], permissionsNeeded: ["VIEW_SUBCATEGORIES"] },
    ],
  },
  {
    group: "Business",
    items: [
      { name: "Products", href: "/dashboard/products", icon: Package, allowedRoles: ["ADMIN", "EMPLOYEE", "VENDOR"], permissionsNeeded: ["VIEW_PRODUCTS"] },
      { name: "Inventory", href: "/dashboard/inventory", icon: Warehouse, allowedRoles: ["ADMIN", "EMPLOYEE"], permissionsNeeded: ["VIEW_INVENTORY"] },
    ],
  },
];

export const revenueData = [
  { name: "Jan", revenue: 4000 },
  { name: "Feb", revenue: 3000 },
  { name: "Mar", revenue: 5000 },
  { name: "Apr", revenue: 2780 },
  { name: "May", revenue: 6890 },
  { name: "Jun", revenue: 8390 },
  { name: "Jul", revenue: 10490 },
];

export const recentActivities = [
  {
    id: 1,
    description: "New customer registered",
    timestamp: "2 minutes ago",
    type: "customer",
  },
  {
    id: 2,
    description: "Order #OD-1029 received",
    timestamp: "15 minutes ago",
    type: "order",
  },
  {
    id: 3,
    description: "Payment completed for ₹12,500",
    timestamp: "1 hour ago",
    type: "payment",
  },
  {
    id: 4,
    description: "Inventory updated for Product X",
    timestamp: "3 hours ago",
    type: "inventory",
  },
];

export const recentOrders = [
  {
    id: "ORD-9381",
    customer: "Liam Johnson",
    product: "MacBook Pro M3",
    amount: "₹1,89,900",
    status: "Delivered",
    date: "2023-10-12",
  },
  {
    id: "ORD-9382",
    customer: "Olivia Smith",
    product: "iPhone 15 Pro Max",
    amount: "₹1,59,900",
    status: "Processing",
    date: "2023-10-12",
  },
  {
    id: "ORD-9383",
    customer: "Noah Williams",
    product: "Sony WH-1000XM5",
    amount: "₹29,990",
    status: "Shipped",
    date: "2023-10-11",
  },
  {
    id: "ORD-9384",
    customer: "Emma Brown",
    product: "Samsung Galaxy S24 Ultra",
    amount: "₹1,29,999",
    status: "Pending",
    date: "2023-10-11",
  },
  {
    id: "ORD-9385",
    customer: "Ava Davis",
    product: "Dell XPS 15",
    amount: "₹1,45,000",
    status: "Cancelled",
    date: "2023-10-10",
  },
];
