"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, CalendarDays, CheckSquare,
  LogOut, Settings, GraduationCap, Flame, BarChart2,
  BookMarked, Timer, NotebookPen, History, Trophy,
} from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { useStudyTopicStore } from "@/store/useStudyTopicStore";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { SemesterSelector } from "@/features/semesters/SemesterSelector";
import { useAppData } from "@/hooks/useAppData";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
      { href: "/dashboard/courses", icon: BookOpen, label: "Courses" },
      { href: "/dashboard/routine", icon: CalendarDays, label: "Routine" },
      { href: "/dashboard/topics", icon: CheckSquare, label: "Study Topics" },
      { href: "/dashboard/exams", icon: BookMarked, label: "Exams & CGPA" },
    ],
  },
  {
    label: "Productivity",
    items: [
      { href: "/dashboard/pomodoro", icon: Timer, label: "Pomodoro" },
      { href: "/dashboard/habits", icon: Flame, label: "Habits" },
      { href: "/dashboard/analytics", icon: BarChart2, label: "Analytics" },
    ],
  },
  {
    label: "Journal",
    items: [
      { href: "/dashboard/mistakes", icon: NotebookPen, label: "Mistake Journal" },
      { href: "/dashboard/history", icon: History, label: "History" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/settings", icon: Settings, label: "Settings" },
    ],
  },
];

function NavItem({ href, icon: Icon, label, badge }: { href: string; icon: React.ElementType; label: string; badge?: number }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link href={href}>
      <span className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 group",
        isActive
          ? "bg-indigo-500/15 text-indigo-400"
          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
      )}>
        <Icon className={cn("mr-3 h-4 w-4 flex-shrink-0", isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")} />
        <span className="flex-1">{label}</span>
        {badge != null && badge > 0 && (
          <span className="ml-auto bg-rose-500/20 text-rose-400 text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {badge}
          </span>
        )}
      </span>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { appwriteUser } = useAuthStore();
  const { topics } = useStudyTopicStore();
  const overdueCount = topics.filter((t) => t.status === "overdue").length;

  // Bootstrap all data
  useAppData();

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-50">
      {/* Sidebar */}
      <aside className="w-60 border-r border-zinc-800/60 bg-zinc-950 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-zinc-800/60">
          <div className="bg-indigo-500/10 rounded-lg p-1.5 mr-2.5">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-zinc-100">Student OS</span>
            <p className="text-[10px] text-zinc-500 leading-none">Academic System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    {...item}
                    badge={item.href === "/dashboard/topics" ? overdueCount : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-zinc-800/60 space-y-2">
          <div className="flex items-center px-3 py-2 rounded-lg bg-zinc-900/50">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {appwriteUser?.name?.[0]?.toUpperCase() ?? "S"}
            </div>
            <div className="ml-2 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">{appwriteUser?.name ?? "Student"}</p>
              <p className="text-[10px] text-zinc-500 truncate">{appwriteUser?.email ?? ""}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60 h-8 px-3 text-xs"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm flex-shrink-0 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-zinc-300">Command Center</span>
          </div>
          <SemesterSelector />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
