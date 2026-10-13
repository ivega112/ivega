"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, SatelliteDish, Menu, Terminal, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/software-components/ui/sheet";
import { Button } from "@/software-components/ui/button";
import { logoutAction } from "./actions";

export default function MobileNav({ username }: { username?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/software/admin", label: "الأجهزة", icon: LayoutDashboard },
    { href: "/software/admin/logs", label: "سجل النظام", icon: Terminal },
    { href: "/software/admin/settings", label: "إعدادات الموقع", icon: Settings },
  ];

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="ghost" size="icon" aria-label="القائمة">
        <Menu className="w-6 h-6" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[280px] p-0 flex flex-col">
          <SheetTitle className="sr-only">قائمة الإدارة</SheetTitle>
          <div className="h-16 flex items-center px-6 border-b border-border">
            <SatelliteDish className="w-6 h-6 text-primary ml-2" />
            <span className="font-bold text-lg tracking-tight">Smart Line</span>
          </div>

          <nav className="flex-1 py-6 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5 ml-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-2">
            <div className="px-4 py-2 text-sm flex items-center">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center ml-3">
                {username?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">{username}</p>
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
        </SheetContent>
      </Sheet>
    </>
  );
}
