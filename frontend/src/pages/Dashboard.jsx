import { Users, ShoppingBag, CreditCard, Building2, Download } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import { RevenueChart } from "../components/dashboard/RevenueChart";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { RecentOrders } from "../components/dashboard/RecentOrders";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

export function Dashboard() {
  const { user } = useAuth();
  
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Good morning, {user?.name || "User"} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here is what is happening with your business today. {currentDate}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="hidden sm:flex">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>View Reports</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value="45,231"
          icon={Users}
          trend="up"
          trendValue="20.1%"
        />
        <StatCard
          title="Total Orders"
          value="8,549"
          icon={ShoppingBag}
          trend="up"
          trendValue="12.5%"
        />
        <StatCard
          title="Total Revenue"
          value="₹1,24,500"
          icon={CreditCard}
          trend="up"
          trendValue="15.3%"
        />
        <StatCard
          title="Active Employees"
          value="1,204"
          icon={Building2}
          trend="down"
          trendValue="2.1%"
        />
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RevenueChart />
        <RecentActivity />
      </div>

      {/* Recent Orders Table */}
      <div className="grid grid-cols-1">
        <RecentOrders />
      </div>
    </div>
  );
}
