import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { recentActivities } from "../../data/mockData";
import { UserPlus, ShoppingBag, CreditCard, Package } from "lucide-react";

const getIcon = (type) => {
  switch (type) {
    case "customer":
      return <UserPlus className="h-4 w-4 text-blue-600" />;
    case "order":
      return <ShoppingBag className="h-4 w-4 text-indigo-600" />;
    case "payment":
      return <CreditCard className="h-4 w-4 text-emerald-600" />;
    case "inventory":
      return <Package className="h-4 w-4 text-amber-600" />;
    default:
      return <div className="h-4 w-4 rounded-full bg-slate-200" />;
  }
};

const getBgColor = (type) => {
  switch (type) {
    case "customer":
      return "bg-blue-50";
    case "order":
      return "bg-indigo-50";
    case "payment":
      return "bg-emerald-50";
    case "inventory":
      return "bg-amber-50";
    default:
      return "bg-slate-50";
  }
};

export function RecentActivity() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getBgColor(activity.type)}`}>
                {getIcon(activity.type)}
              </div>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-slate-900">
                  {activity.description}
                </p>
                <p className="text-xs text-slate-500">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
