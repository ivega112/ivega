"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Terminal } from "lucide-react";

const navItems = [
  { href: "/software/admin", label: "الأجهزة", icon: LayoutDashboard },
  { href: "/software/admin/logs", label: "سجل النظام", icon: Terminal },
  { href: "/software/admin/settings", label: "إعدادات الموقع", icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 py-6 px-4 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
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
  );
}
