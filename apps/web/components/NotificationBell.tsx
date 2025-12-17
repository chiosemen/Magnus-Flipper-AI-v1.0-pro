"use client";

import { Bell } from "lucide-react";

export default function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Notifications"
      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted"
      onClick={() => alert("Notifications coming soon")}
    >
      <Bell className="h-5 w-5" />
    </button>
  );
}
