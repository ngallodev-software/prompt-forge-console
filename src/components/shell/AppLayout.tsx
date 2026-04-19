import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette } from "./CommandPalette";
import { EnvironmentBadge } from "@/components/pf/EnvironmentBadge";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { RoleSwitcher } from "./RoleSwitcher";
import { GlobalHealthStrip } from "./GlobalHealthStrip";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Bug } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { RouteErrorBoundary } from "@/components/pf/RouteErrorBoundary";

export function AppLayout() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const debug = useAppStore((s) => s.debug);
  const setDebug = useAppStore((s) => s.setDebug);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
            <div className="flex h-12 items-center gap-2 px-3">
              <SidebarTrigger />
              <div className="flex-1 flex items-center gap-2 max-w-2xl">
                <CommandPalette />
              </div>
              <div className="hidden md:flex items-center gap-2">
                <EnvironmentBadge />
                <WorkspaceSwitcher />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDebug(!debug)}
                aria-label="Toggle debug overlay"
                title="Toggle Query Inspector"
                className={debug ? "text-primary" : ""}
              >
                <Bug className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <RoleSwitcher />
            </div>
            <GlobalHealthStrip />
          </header>
          <main className="flex-1 min-w-0">
            <RouteErrorBoundary>
              <Outlet />
            </RouteErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
