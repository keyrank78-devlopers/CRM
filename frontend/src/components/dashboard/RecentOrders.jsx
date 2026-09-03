import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/Table";
import { recentOrders } from "../../data/mockData";
import { MoreHorizontal } from "lucide-react";

const getStatusBadge = (status) => {
  switch (status) {
    case "Delivered":
      return <Badge variant="success">Delivered</Badge>;
    case "Processing":
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
    case "Shipped":
      return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">Shipped</Badge>;
    case "Pending":
      return <Badge variant="warning">Pending</Badge>;
    case "Cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function RecentOrders() {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.product}</TableCell>
                <TableCell className="text-slate-500">{order.date}</TableCell>
                <TableCell>{order.amount}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
