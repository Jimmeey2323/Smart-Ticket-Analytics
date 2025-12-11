import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  AlertCircle,
  Timer,
} from "lucide-react";
import type { Ticket as TicketType } from "@shared/schema";

interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  pending: number;
  resolved: number;
  escalated: number;
  avgResolutionHours: number;
  slaCompliancePercent: number;
  ticketsTrend: number;
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  trendDirection,
  className = "",
}: { 
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300" />
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {trend !== undefined && (
              <span className={`flex items-center text-xs ${
                trendDirection === 'up' ? 'text-green-600 dark:text-green-400' :
                trendDirection === 'down' ? 'text-red-600 dark:text-red-400' :
                'text-muted-foreground'
              }`}>
                {trendDirection === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                 trendDirection === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TicketPreviewCard({ ticket }: { ticket: TicketType }) {
  const priorityColors: Record<string, string> = {
    critical: 'priority-critical',
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low',
  };

  const statusStyles: Record<string, string> = {
    open: 'status-open',
    in_progress: 'status-in-progress',
    pending: 'status-pending',
    resolved: 'status-resolved',
    closed: 'status-closed',
    escalated: 'status-escalated',
  };

  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card className="cursor-pointer hover-elevate transition-smooth">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-2 ${priorityColors[ticket.priority]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground font-mono">
                  {ticket.ticketNumber}
                </span>
                <Badge variant="secondary" className={`text-xs ${statusStyles[ticket.status]}`}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </div>
              <h4 className="font-medium text-sm truncate">{ticket.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {ticket.clientName}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentTickets, isLoading: ticketsLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets", { limit: 5, sort: "createdAt", order: "desc" }],
  });

  const { data: urgentTickets } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets", { priority: "critical,high", status: "open,in_progress", limit: 5 }],
  });

  const { data: dueSoonTickets } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets", { slaStatus: "warning", limit: 5 }],
  });

  if (statsLoading) {
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
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of customer feedback and ticket status
          </p>
        </div>
        <Button asChild data-testid="button-create-ticket">
          <Link href="/tickets/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tickets"
          value={stats?.total || 0}
          icon={Ticket}
          trend={stats?.ticketsTrend}
          trendDirection={stats?.ticketsTrend && stats.ticketsTrend > 0 ? 'up' : 'down'}
          description="this month"
        />
        <StatCard
          title="Open Tickets"
          value={stats?.open || 0}
          icon={AlertCircle}
          description="awaiting action"
        />
        <StatCard
          title="Avg Resolution"
          value={`${stats?.avgResolutionHours || 0}h`}
          icon={Timer}
          description="average time"
        />
        <StatCard
          title="SLA Compliance"
          value={`${stats?.slaCompliancePercent || 0}%`}
          icon={CheckCircle2}
          trendDirection={stats?.slaCompliancePercent && stats.slaCompliancePercent >= 90 ? 'up' : 'down'}
          description="on-time resolution"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold">{stats?.inProgress || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{stats?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-xl font-bold">{stats?.resolved || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Escalated</p>
                <p className="text-xl font-bold">{stats?.escalated || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">High Priority</CardTitle>
              <CardDescription>Critical & high priority tickets</CardDescription>
            </div>
            <Badge variant="destructive" className="text-xs">
              {urgentTickets?.length || 0}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticketsLoading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))
            ) : urgentTickets?.length ? (
              urgentTickets.slice(0, 3).map((ticket) => (
                <TicketPreviewCard key={ticket.id} ticket={ticket} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No urgent tickets
              </p>
            )}
            {(urgentTickets?.length || 0) > 3 && (
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/tickets?priority=critical,high">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Due Soon</CardTitle>
              <CardDescription>Approaching SLA deadline</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              {dueSoonTickets?.length || 0}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticketsLoading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))
            ) : dueSoonTickets?.length ? (
              dueSoonTickets.slice(0, 3).map((ticket) => (
                <TicketPreviewCard key={ticket.id} ticket={ticket} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tickets due soon
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest tickets created</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticketsLoading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))
            ) : recentTickets?.length ? (
              recentTickets.slice(0, 3).map((ticket) => (
                <TicketPreviewCard key={ticket.id} ticket={ticket} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent tickets
              </p>
            )}
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/tickets">
                View All Tickets
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
