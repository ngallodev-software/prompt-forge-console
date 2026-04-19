import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  GitBranch,
  FileText,
  Send,
  ClipboardCheck,
  Settings2,
  BookText,
  FileCode,
  Crosshair,
  ScrollText,
  HeartPulse,
  Settings,
  ChevronsLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Health", url: "/health", icon: HeartPulse },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Intake", url: "/intake", icon: Inbox },
      { title: "Pipeline", url: "/pipeline", icon: GitBranch },
      { title: "Prompts", url: "/prompts", icon: FileText },
      { title: "Deliveries", url: "/deliveries", icon: Send },
      { title: "Review", url: "/review", icon: ClipboardCheck },
      { title: "Logs", url: "/logs", icon: ScrollText },
    ],
  },
  {
    label: "Configuration",
    items: [
      { title: "Rules", url: "/rules", icon: Settings2 },
      { title: "Dictionary", url: "/dictionary", icon: BookText },
      { title: "Templates", url: "/templates", icon: FileCode },
      { title: "Targets", url: "/targets", icon: Crosshair },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const isActive = (url: string) =>
    url === "/pipeline" ? pathname.startsWith("/pipeline") : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-bold">
              P
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-tight truncate">PromptForge</div>
                <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Operator Console</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
              className="rounded p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && <SidebarGroupLabel>{g.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                        <NavLink
                          to={item.url}
                          className={cn(
                            "flex items-center gap-2",
                            active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-2 py-1.5 text-[10px] text-sidebar-foreground/60">
            v0.1.0 · mock data
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
