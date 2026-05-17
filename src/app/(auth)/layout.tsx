import React from "react";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div suppressHydrationWarning className="w-full max-w-md space-y-8">
        <div suppressHydrationWarning className="flex flex-col items-center justify-center space-y-2">
          <div className="bg-indigo-500/10 p-3 rounded-2xl ring-1 ring-indigo-500/20">
            <GraduationCap className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Student OS
          </h1>
          <p className="text-sm text-zinc-400">
            Academic Intelligence System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
