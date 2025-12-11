import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  Ticket,
  Target,
} from "lucide-react";
import { categories, departments } from "@/lib/categories";
import type { Ticket as TicketType } from "@shared/schema";

interface AnalyticsData {
  totalTickets: number;
  resolvedTickets: number;
  avgResolutionHours: number;
  slaCompliance: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  ticketsByCategory: Record<string, number>;
  ticketsByDepartment: Record<string, number>;
  ticketsTrend: { date: string; count: number }[];
  topCategories: { category: string; count: number }[];
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend,
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                trend.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                <TrendingUp className={`h-4 w-4 ${!trend.positive && 'rotate-180'}`} />
                {trend.value}% from last period
              </div>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ 
  label, 
  value, 
  total, 
  color = "bg-primary" 
}: { 
  label: string; 
  value: number; 
  total: number;
  color?: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="truncate">{label}</span>
        <span className="text-muted-foreground ml-2">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div 
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState("month");

  const { data: tickets = [], isLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets"],
  });

  const analytics = {
    totalTickets: tickets.length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
    escalatedTickets: tickets.filter(t => t.isEscalated).length,
    criticalTickets: tickets.filter(t => t.priority === 'critical').length,
    highPriorityTickets: tickets.filter(t => t.priority === 'high').length,
  };

  const ticketsByStatus: Record<string, number> = {};
  const ticketsByPriority: Record<string, number> = {};
  const ticketsByCategory: Record<string, number> = {};
  const ticketsByDepartment: Record<string, number> = {};

  tickets.forEach(ticket => {
    ticketsByStatus[ticket.status] = (ticketsByStatus[ticket.status] || 0) + 1;
    ticketsByPriority[ticket.priority] = (ticketsByPriority[ticket.priority] || 0) + 1;
    if (ticket.categoryId) {
      ticketsByCategory[ticket.categoryId] = (ticketsByCategory[ticket.categoryId] || 0) + 1;
    }
    if (ticket.department) {
      ticketsByDepartment[ticket.department] = (ticketsByDepartment[ticket.department] || 0) + 1;
    }
  });

  const resolutionRate = analytics.totalTickets > 0 
    ? Math.round((analytics.resolvedTickets / analytics.totalTickets) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track performance metrics and insights
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]" data-testid="select-period">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="quarter">Last 90 days</SelectItem>
            <SelectItem value="year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Tickets"
          value={analytics.totalTickets}
          subtitle="All time"
          icon={Ticket}
        />
        <MetricCard
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          subtitle={`${analytics.resolvedTickets} resolved`}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Open Tickets"
          value={analytics.openTickets}
          subtitle="Awaiting action"
          icon={Clock}
        />
        <MetricCard
          title="Escalated"
          value={analytics.escalatedTickets}
          subtitle="Requires attention"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tickets by Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar 
              label="Open" 
              value={ticketsByStatus.open || 0} 
              total={analytics.totalTickets}
              color="bg-blue-500"
            />
            <ProgressBar 
              label="In Progress" 
              value={ticketsByStatus.in_progress || 0} 
              total={analytics.totalTickets}
              color="bg-amber-500"
            />
            <ProgressBar 
              label="Pending" 
              value={ticketsByStatus.pending || 0} 
              total={analytics.totalTickets}
              color="bg-yellow-500"
            />
            <ProgressBar 
              label="Resolved" 
              value={ticketsByStatus.resolved || 0} 
              total={analytics.totalTickets}
              color="bg-green-500"
            />
            <ProgressBar 
              label="Closed" 
              value={ticketsByStatus.closed || 0} 
              total={analytics.totalTickets}
              color="bg-slate-500"
            />
            <ProgressBar 
              label="Escalated" 
              value={ticketsByStatus.escalated || 0} 
              total={analytics.totalTickets}
              color="bg-red-500"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tickets by Priority
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar 
              label="Critical" 
              value={ticketsByPriority.critical || 0} 
              total={analytics.totalTickets}
              color="bg-red-500"
            />
            <ProgressBar 
              label="High" 
              value={ticketsByPriority.high || 0} 
              total={analytics.totalTickets}
              color="bg-orange-500"
            />
            <ProgressBar 
              label="Medium" 
              value={ticketsByPriority.medium || 0} 
              total={analytics.totalTickets}
              color="bg-yellow-500"
            />
            <ProgressBar 
              label="Low" 
              value={ticketsByPriority.low || 0} 
              total={analytics.totalTickets}
              color="bg-green-500"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tickets by Department
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {departments.map(dept => (
              <ProgressBar 
                key={dept.id}
                label={dept.name} 
                value={ticketsByDepartment[dept.id] || 0} 
                total={analytics.totalTickets}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Most common feedback categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories
              .map(cat => ({
                ...cat,
                count: ticketsByCategory[cat.id] || 0
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 8)
              .map(cat => (
                <div key={cat.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                  <Badge variant="secondary">{cat.count}</Badge>
                </div>
              ))}
            {Object.keys(ticketsByCategory).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No category data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Critical tickets</span>
                <Badge variant="destructive">{analytics.criticalTickets}</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">High priority</span>
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                  {analytics.highPriorityTickets}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">In progress</span>
                <Badge variant="secondary">{analytics.inProgressTickets}</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Escalated</span>
                <Badge variant="destructive">{analytics.escalatedTickets}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>SLA Performance</CardTitle>
            <CardDescription>
              Track response and resolution time performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Avg First Response</p>
                <p className="text-2xl font-bold mt-1">-</p>
                <p className="text-xs text-muted-foreground mt-1">Target: 2 hours</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                <p className="text-2xl font-bold mt-1">-</p>
                <p className="text-xs text-muted-foreground mt-1">Target: 24 hours</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                <p className="text-2xl font-bold mt-1">-</p>
                <p className="text-xs text-muted-foreground mt-1">Target: 95%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                <p className="text-2xl font-bold mt-1">-</p>
                <p className="text-xs text-muted-foreground mt-1">Target: 4.5/5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
