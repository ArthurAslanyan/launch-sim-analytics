import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, AppHeader } from "@/components/AppSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
}

export function DashboardLayout({ children, title, subtitle, headerActions }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-auto">
            {(title || subtitle || headerActions) && (
              <div className="flex flex-col gap-4 border-b bg-card px-6 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <div>
                  {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
                  {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
                </div>
                {headerActions && (
                  <div className="flex flex-wrap items-center gap-2">{headerActions}</div>
                )}
              </div>
            )}
            <div className="p-6 lg:p-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
