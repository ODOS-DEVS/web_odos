import type { Metadata } from "next";
import { ChatsTab } from "@/components/account/chats-tab";
import { PageHeader } from "@/components/vendor/vendor-ui";

export const metadata: Metadata = { title: "Messages" };

export default function SellerChatsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Messages" description="Conversations with your customers." />
      <ChatsTab />
    </div>
  );
}
