import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Plus,
  List,
  Kanban,
  Calendar,
  Clock,
  MoreVertical,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { categories, type CategoryData } from "@/lib/categories";
import type { Ticket } from "@shared/schema";

type ViewType = "list" | "kanban" | "calendar" | "timeline";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "escalated", label: "Escalated" },
];

const priorityOptions = [
  { value: "all", label: "All Priorities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const statusColumns = [
  { key: "open", label: "Open", color: "bg-blue-500" },
  { key: "in_progress", label: "In Progress", color: "bg-amber-500" },
  { key: "pending", label: "Pending", color: "bg-yellow-500" },
  { key: "resolved", label: "Resolved", color: "bg-green-500" },
  { key: "closed", label: "Closed", color: "bg-slate-500" },
];

function TicketCard({ ticket, compact = false }: { ticket: Ticket; compact?: boolean }) {
  const priorityColors: Record<string, string> = {
    critical: "priority-critical",
    high: "priority-high",
    medium: "priority-medium",
    low: "priority-low",
  };

  const statusStyles: Record<string, string> = {
    open: "status-open",
    in_progress: "status-in-progress",
    pending: "status-pending",
    resolved: "status-resolved",
    closed: "status-closed",
    escalated: "status-escalated",
  };

  const category = categories.find((c) => c.id === ticket.categoryId);

  if (compact) {
    return (
      <Link href={`/tickets/${ticket.id}`}>
        <Card className="cursor-pointer hover-elevate active-elevate-2 transition-smooth mb-2">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-1.5 ${priorityColors[ticket.priority]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ticket.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {ticket.ticketNumber} - {ticket.clientName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card className="cursor-pointer hover-elevate active-elevate-2 transition-smooth">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`w-2 h-full min-h-[48px] rounded-full ${priorityColors[ticket.priority]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">
                    {ticket.ticketNumber}
                  </span>
                  <Badge variant="secondary" className={`text-xs ${statusStyles[ticket.status]}`}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                  {ticket.isEscalated && (
                    <Badge variant="destructive" className="text-xs">
                      Escalated
                    </Badge>
                  )}
                </div>
                <h3 className="font-medium text-sm mb-1">{ticket.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {ticket.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span>{ticket.clientName}</span>
                  {category && (
                    <>
                      <span className="opacity-50">-</span>
                      <span>{category.name}</span>
                    </>
                  )}
                  {ticket.slaDeadline && (
                    <>
                      <span className="opacity-50">-</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due {new Date(ticket.slaDeadline).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Assign</DropdownMenuItem>
                <DropdownMenuItem>Change Status</DropdownMenuItem>
                <DropdownMenuItem>Change Priority</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ListView({ tickets, isLoading }: { tickets: Ticket[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-2">No tickets found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or create a new ticket.
          </p>
          <Button asChild>
            <Link href="/tickets/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}

function KanbanView({ tickets, isLoading }: { tickets: Ticket[]; isLoading: boolean }) {
  const ticketsByStatus = useMemo(() => {
    const grouped: Record<string, Ticket[]> = {};
    statusColumns.forEach((col) => {
      grouped[col.key] = tickets.filter((t) => t.status === col.key);
    });
    return grouped;
  }, [tickets]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {statusColumns.map((col) => (
          <div key={col.key} className="space-y-3">
            <Skeleton className="h-8 w-full" />
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {statusColumns.map((col) => (
        <div key={col.key} className="kanban-column min-w-[250px]">
          <div className="flex items-center gap-2 mb-3 p-2 rounded-md bg-muted/50">
            <div className={`w-3 h-3 rounded-full ${col.color}`} />
            <span className="font-medium text-sm">{col.label}</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {ticketsByStatus[col.key]?.length || 0}
            </Badge>
          </div>
          <div className="space-y-2">
            {ticketsByStatus[col.key]?.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} compact />
            ))}
            {!ticketsByStatus[col.key]?.length && (
              <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-md">
                No tickets
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarView({ tickets }: { tickets: Ticket[] }) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const ticketsByDate = useMemo(() => {
    const grouped: Record<string, Ticket[]> = {};
    tickets.forEach((ticket) => {
      if (ticket.slaDeadline) {
        const date = new Date(ticket.slaDeadline).toISOString().split("T")[0];
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(ticket);
      }
    });
    return grouped;
  }, [tickets]);

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day bg-muted/20" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayTickets = ticketsByDate[dateKey] || [];
    const isToday = day === today.getDate();

    days.push(
      <div
        key={day}
        className={`calendar-day border rounded-md ${isToday ? "ring-2 ring-primary" : ""}`}
      >
        <div className={`text-xs font-medium p-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
          {day}
        </div>
        <div className="space-y-0.5 px-1 pb-1">
          {dayTickets.slice(0, 3).map((ticket) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <div className={`calendar-event cursor-pointer ${
                ticket.priority === "critical" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
                ticket.priority === "high" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" :
                "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
              }`}>
                {ticket.ticketNumber}
              </div>
            </Link>
          ))}
          {dayTickets.length > 3 && (
            <div className="text-xs text-muted-foreground text-center">
              +{dayTickets.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{monthNames[currentMonth]} {currentYear}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-xs font-medium text-muted-foreground text-center p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </CardContent>
    </Card>
  );
}

function TimelineView({ tickets }: { tickets: Ticket[] }) {
  const sortedTickets = useMemo(() => {
    return [...tickets].sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }, [tickets]);

  const groupedByDate = useMemo(() => {
    const grouped: Record<string, Ticket[]> = {};
    sortedTickets.forEach((ticket) => {
      const date = new Date(ticket.createdAt!).toLocaleDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(ticket);
    });
    return grouped;
  }, [sortedTickets]);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, dateTickets]) => (
        <div key={date}>
          <h3 className="font-medium text-sm text-muted-foreground mb-3">{date}</h3>
          <div className="space-y-0">
            {dateTickets.map((ticket, index) => (
              <div
                key={ticket.id}
                className={`timeline-item ${index === dateTickets.length - 1 ? "pb-0 border-l-0" : ""}`}
              >
                <Link href={`/tickets/${ticket.id}`}>
                  <Card className="cursor-pointer hover-elevate transition-smooth">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {ticket.ticketNumber}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ticket.clientName} - {new Date(ticket.createdAt!).toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Tickets() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const viewParam = urlParams.get("view") as ViewType | null;

  const [view, setView] = useState<ViewType>(viewParam || "list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        !search ||
        ticket.title.toLowerCase().includes(search.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        ticket.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      const matchesCategory = categoryFilter === "all" || ticket.categoryId === categoryFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter]);

  const viewIcons: Record<ViewType, React.ElementType> = {
    list: List,
    kanban: Kanban,
    calendar: Calendar,
    timeline: Clock,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">
            Manage and track all customer feedback tickets
          </p>
        </div>
        <Button asChild data-testid="button-new-ticket">
          <Link href="/tickets/new">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
        <TabsList className="w-full sm:w-auto">
          {(["list", "kanban", "calendar", "timeline"] as ViewType[]).map((v) => {
            const Icon = viewIcons[v];
            return (
              <TabsTrigger
                key={v}
                value={v}
                className="flex items-center gap-2"
                data-testid={`tab-${v}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline capitalize">{v}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="list" className="m-0">
            <ListView tickets={filteredTickets} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="kanban" className="m-0">
            <KanbanView tickets={filteredTickets} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="calendar" className="m-0">
            <CalendarView tickets={filteredTickets} />
          </TabsContent>
          <TabsContent value="timeline" className="m-0">
            <TimelineView tickets={filteredTickets} />
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredTickets.length} of {tickets.length} tickets
        </span>
      </div>
    </div>
  );
}
