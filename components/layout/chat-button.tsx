"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { useSession } from "@/hooks/use-auth";
import { useChatThreads } from "@/hooks/use-chats";

/** Header entry point into the account "Chats" tab — only shown once there's a shopper to have chats. */
export function ChatButton() {
  const session = useSession();
  const { ready, unreadCount } = useChatThreads();

  if (!session) return null;

  return (
    <Link
      href="/account?tab=chats"
      className="press grid size-9 place-items-center rounded-full hover:bg-surface-muted min-[320px]:size-10"
      aria-label={ready && unreadCount > 0 ? `Vendor chats, ${unreadCount} unread` : "Vendor chats"}
    >
      <NotificationBadge variant="count" count={ready ? unreadCount : 0}>
        <MessageCircle className="size-4.5 min-[320px]:size-5" aria-hidden />
      </NotificationBadge>
    </Link>
  );
}
