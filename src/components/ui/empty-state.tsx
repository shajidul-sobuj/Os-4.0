// Empty state component used across all list views
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-2xl bg-zinc-800/40 p-4 mb-4">
        <Icon className="w-10 h-10 text-zinc-500" />
      </div>
      <h3 className="text-base font-medium text-zinc-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
