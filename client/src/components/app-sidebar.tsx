import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  LayoutTemplate,
  Ticket,
  PlusCircle,
  BarChart3,
  Users,
  Settings,
  Bell,
  Filter,
  Calendar,
  Kanban,
  List,
  Clock,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { useQuery } from "@tanstack/react-query";
import type { Notification } from "@shared/schema";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "All Tickets",
    url: "/tickets",
    icon: Ticket,
  },
  {
    title: "Create Ticket",
    url: "/tickets/new",
    icon: PlusCircle,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: LayoutTemplate,
  },
];

const viewItems = [
  {
    title: "List View",
    url: "/tickets?view=list",
    icon: List,
  },
  {
    title: "Kanban Board",
    url: "/tickets?view=kanban",
    icon: Kanban,
  },
  {
    title: "Calendar",
    url: "/tickets?view=calendar",
    icon: Calendar,
  },
  {
    title: "Timeline",
    url: "/tickets?view=timeline",
    icon: Clock,
  },
];

const analyticsItems = [
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Team Performance",
    url: "/analytics/team",
    icon: Users,
  },
];

const settingsItems = [
  {
    title: "Saved Filters",
    url: "/filters",
    icon: Filter,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const { toast } = useToast();
  
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/unread"],
    enabled: !!user,
  });

  const unreadCount = notifications?.length || 0;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      queryClient.clear();
      toast({ title: "Signed out", description: "You have been signed out." });
    } catch (e: any) {
      toast({
        title: "Sign out failed",
        description: String(e?.message || e),
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar className={`border-r backdrop-blur-lg shadow-lg transition-colors duration-200 ${isDark ? 'bg-slate-900/60 border-blue-800/30' : 'bg-white/75 border-blue-100/60'}`}>
      <SidebarHeader className={`px-6 py-5 border-b transition-colors duration-200 ${isDark ? 'border-slate-700/50 bg-slate-800/50' : 'border-blue-100/40 bg-blue-50/30'}`}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Physique 57" className="h-11 w-11 object-contain rounded-lg shadow-md" />
          <div className="flex flex-col">
            <span className={`font-black text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Physique 57</span>
            <span className={`text-xs font-semibold tracking-wide ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>Ticket Manager</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarSeparator />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = location === item.url;
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url} className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? (isDark ? 'accent-gradient-bar text-white shadow-lg' : 'accent-gradient-bar text-white shadow-lg')
                        : (isDark ? 'text-gray-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-700 hover:bg-blue-100/50 hover:text-blue-900')
                    }`}>
                      <span className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all ${isActive ? 'accent-gradient-bar text-white shadow-md' : (isDark ? 'bg-slate-800/50 text-gray-400' : 'bg-blue-100/40 text-blue-600')}`}>
                        <item.icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-semibold">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>Views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {viewItems.map((item) => {
                const viewParam = item.url.split('view=')[1];
                const currentView = new URL(`http://localhost${location}`).searchParams.get('view') || 'list';
                const isActive = location === item.url || (location.startsWith('/tickets') && currentView === viewParam);
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url} className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? (isDark ? 'accent-gradient-bar text-white shadow-lg' : 'accent-gradient-bar text-white shadow-lg')
                        : (isDark ? 'text-gray-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-700 hover:bg-blue-100/50 hover:text-blue-900')
                    }`}>
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : (isDark ? 'text-gray-400' : 'text-blue-600')}`} />
                      <span className="font-semibold">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => {
                const isActive = location === item.url;
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url} className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive ? (isDark ? 'accent-gradient-bar text-white shadow-lg' : 'accent-gradient-bar text-white shadow-lg') : (isDark ? 'text-gray-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-700 hover:bg-blue-100/50 hover:text-blue-900')
                    }`}>
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : (isDark ? 'text-gray-400' : 'text-blue-600')}`} />
                      <span className="font-semibold">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => {
                const isActive = location === item.url;
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url} className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive ? (isDark ? 'accent-gradient-bar text-white shadow-lg' : 'accent-gradient-bar text-white shadow-lg') : (isDark ? 'text-gray-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-700 hover:bg-blue-100/50 hover:text-blue-900')
                    }`}>
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : (isDark ? 'text-gray-400' : 'text-blue-600')}`} />
                      <span className="font-semibold">{item.title}</span>
                      {item.title === "Notifications" && unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="space-y-3">
          <div className={`flex items-center gap-3 rounded-lg p-3 transition-all duration-200 ${isDark ? 'bg-slate-800/60 hover:bg-slate-700/80' : 'bg-blue-50/80 hover:bg-blue-100/80'}`}>
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
              <AvatarFallback className="text-xs font-bold">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {user?.firstName} {user?.lastName}
              </span>
              <span className={`text-xs truncate capitalize font-semibold ${isDark ? 'text-gray-400' : 'text-blue-700'}`}>
                {user?.role?.replace('_', ' ') || 'Staff'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            className={`w-full justify-start font-semibold rounded-lg transition-all duration-200 ${isDark ? 'bg-slate-800/40 hover:bg-slate-700/80 text-red-400 hover:text-red-300' : 'bg-red-50/80 hover:bg-red-100 text-red-700 hover:text-red-800'}`}
            onClick={handleSignOut}
            data-testid="button-sign-out"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
