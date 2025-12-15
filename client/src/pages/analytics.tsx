import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";
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
import type { Ticket as TicketType } from "@shared/schema";

type ApiCategory = {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  color_code?: string | null;
};

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

type Comparison = {
  label: string;
  deltaText: string;
  positive: boolean;
};

function safeToDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as any);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTicketTimestamp(ticket: TicketType): Date | null {
  return (
    safeToDate((ticket as any).reportedDateTime) ||
    safeToDate((ticket as any).createdAt) ||
    safeToDate((ticket as any).incidentDateTime) ||
    null
  );
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function inRange(date: Date, start: Date, end: Date): boolean {
  return date.getTime() >= start.getTime() && date.getTime() < end.getTime();
}

function formatSignedNumber(value: number, decimals = 0): string {
  const rounded = decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  return `${sign}${abs}${decimals > 0 ? "" : ""}`;
}

function formatPercentChange(current: number, previous: number, decimals = 0): string {
  if (previous === 0) {
    return current === 0 ? "0%" : "—";
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = decimals > 0 ? Number(pct.toFixed(decimals)) : Math.round(pct);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "-" : "";
  return `${sign}${Math.abs(rounded)}%`;
}

function buildComparison(
  label: string,
  current: number,
  previous: number,
  opts?: { isPercentMetric?: boolean; decimals?: number }
): Comparison {
  const decimals = opts?.decimals ?? 0;
  const isPercentMetric = opts?.isPercentMetric ?? false;

  const delta = current - previous;
  const positive = delta >= 0;

  const deltaValue = decimals > 0 ? Number(delta.toFixed(decimals)) : Math.round(delta);
  const deltaSign = deltaValue > 0 ? "+" : deltaValue < 0 ? "-" : "";
  const deltaAbs = Math.abs(deltaValue);

  const deltaText = isPercentMetric
    ? `${deltaSign}${deltaAbs}pp (${formatPercentChange(current, previous, 0)})`
    : `${deltaSign}${deltaAbs} (${formatPercentChange(current, previous, 0)})`;

  return { label, deltaText, positive };
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  comparisons,
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: React.ElementType;
  comparisons?: Comparison[];
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
            {comparisons && comparisons.length > 0 && (
              <div className="mt-2 space-y-1">
                {comparisons.slice(0, 2).map((c) => (
                  <div
                    key={c.label}
                    className={`flex items-center gap-1 text-sm ${
                      c.positive
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    <TrendingUp className={`h-4 w-4 ${!c.positive && "rotate-180"}`} />
                    <span className="text-muted-foreground">{c.label}:</span>
                    <span>{c.deltaText}</span>
                  </div>
                ))}
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
  const { theme } = useTheme();

  const { data: categories = [] } = useQuery<ApiCategory[]>({
    queryKey: ["/api/categories"],
  });

  const { data: tickets = [], isLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets"],
  });

  const periodDays =
    period === "week" ? 7 : period === "quarter" ? 90 : period === "year" ? 365 : 30;

  const currentStart = daysAgo(periodDays);
  const currentEnd = new Date();
  const prevStart = daysAgo(periodDays * 2);
  const prevEnd = currentStart;
  const yoyStart = new Date(currentStart);
  const yoyEnd = new Date(currentEnd);
  yoyStart.setFullYear(yoyStart.getFullYear() - 1);
  yoyEnd.setFullYear(yoyEnd.getFullYear() - 1);

  const ticketsInCurrentPeriod = tickets.filter((t) => {
    const ts = getTicketTimestamp(t);
    return ts ? inRange(ts, currentStart, currentEnd) : false;
  });

  const ticketsInPrevPeriod = tickets.filter((t) => {
    const ts = getTicketTimestamp(t);
    return ts ? inRange(ts, prevStart, prevEnd) : false;
  });

  const ticketsInYoYPeriod = tickets.filter((t) => {
    const ts = getTicketTimestamp(t);
    return ts ? inRange(ts, yoyStart, yoyEnd) : false;
  });

  const currentPeriodMetrics = {
    totalTickets: ticketsInCurrentPeriod.length,
    resolvedTickets: ticketsInCurrentPeriod.filter(
      (t) => t.status === "resolved" || t.status === "closed"
    ).length,
    openTickets: ticketsInCurrentPeriod.filter((t) => t.status === "open").length,
    escalatedTickets: ticketsInCurrentPeriod.filter((t) => t.isEscalated).length,
  };

  const prevPeriodMetrics = {
    totalTickets: ticketsInPrevPeriod.length,
    resolvedTickets: ticketsInPrevPeriod.filter(
      (t) => t.status === "resolved" || t.status === "closed"
    ).length,
    openTickets: ticketsInPrevPeriod.filter((t) => t.status === "open").length,
    escalatedTickets: ticketsInPrevPeriod.filter((t) => t.isEscalated).length,
  };

  const yoyPeriodMetrics = {
    totalTickets: ticketsInYoYPeriod.length,
    resolvedTickets: ticketsInYoYPeriod.filter(
      (t) => t.status === "resolved" || t.status === "closed"
    ).length,
    openTickets: ticketsInYoYPeriod.filter((t) => t.status === "open").length,
    escalatedTickets: ticketsInYoYPeriod.filter((t) => t.isEscalated).length,
  };

  const currentResolutionRate =
    currentPeriodMetrics.totalTickets > 0
      ? (currentPeriodMetrics.resolvedTickets / currentPeriodMetrics.totalTickets) * 100
      : 0;
  const prevResolutionRate =
    prevPeriodMetrics.totalTickets > 0
      ? (prevPeriodMetrics.resolvedTickets / prevPeriodMetrics.totalTickets) * 100
      : 0;
  const yoyResolutionRate =
    yoyPeriodMetrics.totalTickets > 0
      ? (yoyPeriodMetrics.resolvedTickets / yoyPeriodMetrics.totalTickets) * 100
      : 0;

  const momLabel = period === "month" ? "MoM" : "Prev";

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

  const departmentKeys = Object.keys(ticketsByDepartment).sort((a, b) => a.localeCompare(b));

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
    <div className={`min-h-screen space-y-8 app-container ${
      theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900' : 'bg-gradient-to-br from-white via-blue-50 to-slate-50'
    }`}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 accent-gradient-text">Analytics</h1>
          <p className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-gray-300' : 'text-slate-700'
          }`}>
            Deep insights into performance metrics and support operations
          </p>
        </div>
      </div>

      <div className="flex justify-end">
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
          value={currentPeriodMetrics.totalTickets}
          subtitle={`Last ${periodDays} days`}
          icon={Ticket}
          comparisons={[
            buildComparison(momLabel, currentPeriodMetrics.totalTickets, prevPeriodMetrics.totalTickets),
            buildComparison("YoY", currentPeriodMetrics.totalTickets, yoyPeriodMetrics.totalTickets),
          ]}
        />
        <MetricCard
          title="Resolution Rate"
          value={`${Math.round(currentResolutionRate)}%`}
          subtitle={`${currentPeriodMetrics.resolvedTickets} resolved`}
          icon={CheckCircle2}
          comparisons={[
            buildComparison(momLabel, currentResolutionRate, prevResolutionRate, { isPercentMetric: true, decimals: 1 }),
            buildComparison("YoY", currentResolutionRate, yoyResolutionRate, { isPercentMetric: true, decimals: 1 }),
          ]}
        />
        <MetricCard
          title="Open Tickets"
          value={currentPeriodMetrics.openTickets}
          subtitle="Awaiting action"
          icon={Clock}
          comparisons={[
            buildComparison(momLabel, currentPeriodMetrics.openTickets, prevPeriodMetrics.openTickets),
            buildComparison("YoY", currentPeriodMetrics.openTickets, yoyPeriodMetrics.openTickets),
          ]}
        />
        <MetricCard
          title="Escalated"
          value={currentPeriodMetrics.escalatedTickets}
          subtitle="Requires attention"
          icon={AlertTriangle}
          comparisons={[
            buildComparison(momLabel, currentPeriodMetrics.escalatedTickets, prevPeriodMetrics.escalatedTickets),
            buildComparison("YoY", currentPeriodMetrics.escalatedTickets, yoyPeriodMetrics.escalatedTickets),
          ]}
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
            {departmentKeys.map((dept) => (
              <ProgressBar
                key={dept}
                label={dept}
                value={ticketsByDepartment[dept] || 0}
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
                      style={{ backgroundColor: (cat as any).color_code ?? cat.color ?? undefined }}
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
