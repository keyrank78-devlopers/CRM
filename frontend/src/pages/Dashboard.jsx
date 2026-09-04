import { useState, useEffect } from "react";
import { Users, ShoppingBag, CreditCard, Building2, Download, UserPlus, Calendar, PhoneCall, ArrowRight, ShieldCheck } from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import { RevenueChart } from "../components/dashboard/RevenueChart";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { RecentOrders } from "../components/dashboard/RecentOrders";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import leadService from "../services/leadService";
import leadOrderService from "../services/leadOrderService";

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    myLeadsCount: 0,
    todayFollowUpsCount: 0,
    myOrdersCount: 0,
    myOrdersRevenue: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const isAdmin = user?.userType === "ADMIN";
  const designationName = user?.designation?.name || user?.role || user?.userType || "Team Member";

  useEffect(() => {
    const fetchPersonalStats = async () => {
      try {
        setLoadingStats(true);
        const [leadsRes, followUpsRes, ordersRes] = await Promise.all([
          leadService.getLeads({ limit: 100 }).catch(() => ({ data: [] })),
          leadService.getFollowUps().catch(() => ({ data: [] })),
          leadOrderService.getLeadOrders({ limit: 100 }).catch(() => ({ data: [] }))
        ]);

        const leads = leadsRes.data || [];
        const followUps = followUpsRes.data || [];
        const orders = ordersRes.data || [];

        const todayStr = new Date().toISOString().split('T')[0];
        const todayFollows = followUps.filter(f => f.followUpDate && f.followUpDate.startsWith(todayStr));
        const ordersTotal = orders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

        setStats({
          myLeadsCount: leads.length,
          todayFollowUpsCount: todayFollows.length,
          myOrdersCount: orders.length,
          myOrdersRevenue: ordersTotal
        });
      } catch (err) {
        console.error("Dashboard stats error", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchPersonalStats();
  }, []);

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Good morning, {user?.name || "User"} 👋
            </h1>
            <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              {designationName}
            </span>
          </div>
          <p className="text-sm text-slate-300">
            Here is your daily activity & performance overview • {currentDate}
          </p>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          {isAdmin && (
            <Button 
              onClick={() => navigate("/dashboard/permissions")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Manage Permissions
            </Button>
          )}
          <Button 
            onClick={() => navigate("/dashboard/leads")}
            variant="outline"
            className="text-white border-slate-700 hover:bg-white/10 text-xs h-9"
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            My Leads
          </Button>
          <Button 
            onClick={() => navigate("/dashboard/follow-ups")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
          >
            <Calendar className="mr-1.5 h-4 w-4" />
            Today's Follow-ups
          </Button>
        </div>
      </div>

      {/* Role Tailored Stats Cards */}
      {isAdmin ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Active Leads"
            value={stats.myLeadsCount.toString()}
            icon={UserPlus}
            trend="up"
            trendValue="Live"
          />
          <StatCard
            title="Pushed Lead Orders"
            value={stats.myOrdersCount.toString()}
            icon={ShoppingBag}
            trend="up"
            trendValue="Live"
          />
          <StatCard
            title="Total Pushed Revenue"
            value={`₹${stats.myOrdersRevenue.toLocaleString('en-IN')}`}
            icon={CreditCard}
            trend="up"
            trendValue="Live"
          />
          <StatCard
            title="Today's Scheduled Follow-ups"
            value={stats.todayFollowUpsCount.toString()}
            icon={Calendar}
            trend="up"
            trendValue="Pending"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">My Assigned Leads</span>
              <UserPlus className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.myLeadsCount}</p>
            <p className="text-xs text-slate-500">Active leads assigned to you</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Follow-ups Today</span>
              <Calendar className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-700">{stats.todayFollowUpsCount}</p>
            <p className="text-xs text-slate-500">Action items scheduled for today</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">My Pushed Orders</span>
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-emerald-700">{stats.myOrdersCount}</p>
            <p className="text-xs text-slate-500">Total orders generated by you</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">My Order Revenue</span>
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-indigo-900">₹{stats.myOrdersRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-500">Total value of pushed orders</p>
          </div>
        </div>
      )}

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
export default Dashboard;
