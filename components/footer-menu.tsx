"use client";

import {
  Home,
  MessageCircle,
  BarChart3,
  Settings,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { icon: MessageCircle, label: "Chat", id: "chat", href: "/chat" },
  { icon: BarChart3, label: "Stats", id: "stats", href: "/stats" },
  { icon: History, label: "History", id: "history", href: "/history" },
  { icon: Settings, label: "Settings", id: "settings", href: "/settings" },
];

interface FooterMenuProps {
  hidden?: boolean;
}

export function FooterMenu({ hidden = false }: FooterMenuProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom z-50 transition-transform duration-300",
        hidden && "translate-y-full"
      )}
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px]",
                isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive && "font-semibold"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
