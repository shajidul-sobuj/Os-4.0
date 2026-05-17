// Reusable badge component for status and priority display
import { cn } from "@/lib/utils";

type Variant = "default" | "pending" | "inprogress" | "completed" | "overdue" | "high" | "medium" | "low" | "upcoming" | "graded";

const variantStyles: Record<Variant, string> = {
  default: "bg-zinc-800 text-zinc-300",
  pending: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  inprogress: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  completed: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  overdue: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
  high: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
  medium: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  low: "bg-zinc-700/50 text-zinc-400 border border-zinc-700/50",
  upcoming: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
  graded: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
};

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Variant> = {
    pending: "pending",
    "in-progress": "inprogress",
    completed: "completed",
    overdue: "overdue",
    upcoming: "upcoming",
    submitted: "inprogress",
    graded: "graded",
  };
  const label: Record<string, string> = {
    "in-progress": "In Progress",
  };
  const variant = map[status] ?? "default";
  return <Badge variant={variant}>{label[status] ?? status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, Variant> = { high: "high", medium: "medium", low: "low" };
  return <Badge variant={map[priority] ?? "default"}>{priority}</Badge>;
}
