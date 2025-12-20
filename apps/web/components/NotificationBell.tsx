"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function NotificationBell() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  return (
    <button
      type="button"
      aria-label="Notifications"
      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted"
      onClick={() => {
        if (!user) {
          openAuthModal("login");
          return;
        }
        router.push("/settings/notifications");
      }}
    >
      <Bell className="h-5 w-5" />
    </button>
  );
}
