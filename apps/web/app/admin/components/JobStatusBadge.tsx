interface JobStatusBadgeProps {
  status: "pending" | "active" | "completed" | "failed";
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const styles = {
    pending: "bg-yellow-500/20 text-yellow-500",
    active: "bg-blue-500/20 text-blue-500",
    completed: "bg-green-500/20 text-green-500",
    failed: "bg-red-500/20 text-red-500",
  };

  return (
    <span
      className={`text-xs px-2 py-1 rounded ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
