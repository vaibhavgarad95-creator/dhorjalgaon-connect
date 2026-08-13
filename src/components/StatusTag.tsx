import { STATUS_LABEL, type IssueStatus } from "@/lib/gp";
import { cn } from "@/lib/utils";

const styles: Record<IssueStatus, string> = {
  pending: "bg-pending text-pending-foreground",
  in_progress: "bg-progress text-progress-foreground",
  completed: "bg-done text-done-foreground",
};

export function StatusTag({ status, className }: { status: IssueStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
        styles[status],
        className,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
      {STATUS_LABEL[status]}
    </span>
  );
}