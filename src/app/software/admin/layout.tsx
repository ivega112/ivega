import { ReactNode } from "react";
import type { Metadata } from "next";
import { LogOut, SatelliteDish } from "lucide-react";
import { getSession } from "@/software-lib/auth";
import { logoutAction } from "./actions";
import { redirect } from "next/navigation";
import MobileNav from "./MobileNav";
import SidebarNav from "./SidebarNav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session?.adminId) {
    redirect("/software/login");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-l border-border bg-card flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <SatelliteDish className="w-6 h-6 text-primary ml-2" />
          <span className="font-bold text-lg tracking-tight">Smart Line</span>
        </div>

        <SidebarNav />

        <div className="p-4 border-t border-border space-y-2">
          <div className="px-4 py-2 text-sm flex items-center">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center ml-3 text-foreground">
              {session.username?.toString()?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-medium">{session.username?.toString()}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center px-4 py-2.5 rounded-lg text-muted-foreground font-medium transition-colors hover:bg-secondary hover:text-destructive"
            >
              <LogOut className="w-5 h-5 ml-3" />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:hidden">
          <div className="flex items-center">
            <SatelliteDish className="w-6 h-6 text-primary ml-2" />
            <span className="font-bold text-lg tracking-tight">Smart Line</span>
          </div>
          <MobileNav username={session.username?.toString()} />
        </header>
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
