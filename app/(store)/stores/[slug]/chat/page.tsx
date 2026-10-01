import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";
import { mockStoreBySlug } from "@/mocks/catalog.mock";

export async function generateMetadata({ params }: PageProps<"/stores/[slug]/chat">): Promise<Metadata> {
  const { slug } = await params;
  const store = mockStoreBySlug(slug);
  if (!store) return {};
  return { title: `Chat with ${store.name}` };
}

export default async function StoreChatPage({ params }: PageProps<"/stores/[slug]/chat">) {
  const { slug } = await params;
  const store = mockStoreBySlug(slug);
  if (!store) notFound();

  return <ChatView store={store} />;
}
