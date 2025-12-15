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

import { useTheme } from "@/components/theme-provider";

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
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  return (
    <Card className={`relative overflow-hidden border backdrop-blur-lg transition-all duration-300 group hover:shadow-2xl ${
      isDark
        ? 'bg-slate-800/50 border-blue-500/40 hover:border-blue-400/80 hover:bg-slate-800/70 hover:shadow-2xl hover:shadow-blue-500/20'
        : 'bg-white/70 border-blue-200/60 hover:border-blue-400/80 hover:bg-white/90 hover:shadow-2xl hover:shadow-blue-300/30'
    } ${className}`}>
      <div className="absolute top-0 left-0 right-0 h-1.5 accent-gradient-bar" />
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className={`text-xs font-black tracking-wider uppercase ${
          isDark ? 'text-blue-300' : 'text-blue-700'
        }`}>
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${
          isDark
            ? 'bg-blue-500/20'
            : 'bg-blue-100/60'
        }`}>
          <Icon className={`h-5 w-5 ${
            isDark ? 'text-blue-300' : 'text-blue-700'
          }`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-4xl font-black ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>{value}</div>
        {(description || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {trend !== undefined && (
              <span className={`flex items-center text-xs ${
                trendDirection === 'up' ? 'text-green-600 dark:text-green-400' :
                trendDirection === 'down' ? 'text-red-600 dark:text-red-400' :
                isDark ? 'text-gray-400' : 'text-slate-500'
              }`}>
                {trendDirection === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                 trendDirection === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
            {description && (
              <p className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-slate-500'
              }`}>{description}</p>
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

  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (statsLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'
    }`}>
      <div className={`border-b transition-colors duration-200 ${isDark ? 'border-slate-700/50 bg-slate-800/50' : 'border-blue-100/40 bg-blue-50/30'}`}>
        <div className="app-container px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight accent-gradient-text">Dashboard</h1>
              <p className={`text-sm font-semibold tracking-wide ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>Overview</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="app-container space-y-8 pt-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              Monitor and manage customer feedback in real-time
            </p>
          </div>
          <Button asChild data-testid="button-create-ticket" className={`px-6 py-3 text-base font-semibold rounded-xl transition-all duration-300 accent-gradient-bar text-white hover:shadow-2xl ${
            isDark
              ? 'hover:shadow-blue-500/40'
              : 'hover:shadow-blue-400/40'
          }`}>
            <Link href="/tickets/new" className="flex items-center gap-2 whitespace-nowrap">
              <Plus className="h-5 w-5" />
              Create New Ticket
            </Link>
          </Button>
        </div>

        {/* Main KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

        {/* Status Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'In Progress', icon: Clock, value: stats?.inProgress || 0, color: 'from-cyan-600 to-blue-600' },
            { title: 'Pending', icon: AlertTriangle, value: stats?.pending || 0, color: 'from-amber-600 to-orange-600' },
            { title: 'Resolved', icon: CheckCircle2, value: stats?.resolved || 0, color: 'from-emerald-600 to-green-600' },
            { title: 'Escalated', icon: AlertTriangle, value: stats?.escalated || 0, color: 'from-rose-600 to-red-600' },
          ].map((c, i) => (
            <Card 
              key={i} 
              className={`relative overflow-hidden backdrop-blur-xl border transition-all duration-500 group cursor-pointer ${
                isDark
                  ? 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/80 hover:bg-slate-800/60 hover:shadow-2xl hover:shadow-slate-900/50'
                  : 'bg-white/60 border-slate-200/60 hover:border-slate-300/80 hover:bg-white/80 hover:shadow-2xl hover:shadow-slate-300/40'
              }`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-600/10 to-transparent rounded-full blur-3xl group-hover:from-slate-500/15 transition-all" />
              
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-semibold uppercase tracking-widest mb-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                      {c.title}
                    </p>
                    <p className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {c.value}
                    </p>
                  </div>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} shadow-lg shadow-current/20`}>
                    <c.icon className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Sections */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* High Priority */}
          <Card className={`relative overflow-hidden backdrop-blur-xl border transition-all duration-500 ${
            isDark
              ? 'bg-slate-800/40 border-rose-700/30 hover:border-rose-600/50 hover:bg-slate-800/60 hover:shadow-2xl hover:shadow-rose-900/20'
              : 'bg-white/60 border-rose-200/50 hover:border-rose-300/80 hover:bg-white/80 hover:shadow-2xl hover:shadow-rose-300/30'
          }`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-red-600 to-rose-600" />
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-rose-600/10 to-transparent rounded-full blur-3xl" />
            
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-black mb-1">Critical Tickets</CardTitle>
                  <CardDescription>High priority items requiring immediate attention</CardDescription>
                </div>
                <Badge variant="destructive" className="text-lg py-1.5 px-3 font-bold">
                  {urgentTickets?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              {ticketsLoading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              ) : urgentTickets?.length ? (
                urgentTickets.slice(0, 3).map((ticket) => (
                  <TicketPreviewCard key={ticket.id} ticket={ticket} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No urgent tickets</p>
              )}
              {(urgentTickets?.length || 0) > 3 && (
                <Button variant="ghost" className="w-full mt-2" asChild>
                  <Link href="/tickets?priority=critical,high" className="flex items-center justify-center gap-2">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* SLA Compliance */}
          <Card className={`relative overflow-hidden backdrop-blur-xl border transition-all duration-500 ${
            isDark
              ? 'bg-slate-800/40 border-blue-700/30 hover:border-blue-600/50 hover:bg-slate-800/60 hover:shadow-2xl hover:shadow-blue-900/20'
              : 'bg-white/60 border-blue-200/50 hover:border-blue-300/80 hover:bg-white/80 hover:shadow-2xl hover:shadow-blue-300/30'
          }`}>
            <div className="absolute top-0 left-0 right-0 h-1 accent-gradient-bar" />
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-3xl" />
            
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-black mb-1">SLA Compliance</CardTitle>
                  <CardDescription>Resolution performance vs target</CardDescription>
                </div>
                <Badge className="text-lg py-1.5 px-3 font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {stats?.slaCompliancePercent || 0}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className={`h-48 rounded-xl overflow-hidden border ${isDark ? 'border-slate-700/50' : 'border-slate-200/60'}`}>
                <div className={`h-full w-full flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-100 to-slate-50'}`}>
                  <div className="text-center">
                    <div className="text-5xl font-black accent-gradient-text mb-2">{stats?.slaCompliancePercent || 0}%</div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Target: 95%</p>
                  </div>
                </div>
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {stats?.slaCompliancePercent && stats.slaCompliancePercent >= 95 ? '✨ Exceeding target' : '📊 Below target'}
              </p>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className={`relative overflow-hidden backdrop-blur-xl border transition-all duration-500 ${
            isDark
              ? 'bg-slate-800/40 border-emerald-700/30 hover:border-emerald-600/50 hover:bg-slate-800/60 hover:shadow-2xl hover:shadow-emerald-900/20'
              : 'bg-white/60 border-emerald-200/50 hover:border-emerald-300/80 hover:bg-white/80 hover:shadow-2xl hover:shadow-emerald-300/30'
          }`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600" />
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-emerald-600/10 to-transparent rounded-full blur-3xl" />
            
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-black mb-1">Recent Activity</CardTitle>
                  <CardDescription>Latest tickets created</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              {ticketsLoading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              ) : recentTickets?.length ? (
                recentTickets.slice(0, 3).map((ticket) => (
                  <TicketPreviewCard key={ticket.id} ticket={ticket} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No recent tickets</p>
              )}
              <Button variant="ghost" className="w-full mt-2" asChild>
                <Link href="/tickets" className="flex items-center justify-center gap-2">
                  View All Tickets <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
