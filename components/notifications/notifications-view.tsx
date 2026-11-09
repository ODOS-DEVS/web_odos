"use client";

import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { NotificationItem } from "./notification-item";
import { notifications } from "./notification-data";

export function NotificationsView() {
  const [read, setRead] = useState(false);

  return (
    <Container className="py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Notifications</h1>
        <div className="mt-10 flex items-center justify-between gap-4">
          <p className="text-sm text-muted sm:text-base">
            {read ? "You’re all caught up" : `${notifications.length} unread`}
          </p>
          <button
            type="button"
            onClick={() => setRead(true)}
            className="press flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface-muted sm:px-5 sm:text-base"
          >
            <CheckCheck className="size-4.5" aria-hidden />
            Mark all read
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} unread={!read} />
          ))}
        </div>
      </div>
    </Container>
  );
}
