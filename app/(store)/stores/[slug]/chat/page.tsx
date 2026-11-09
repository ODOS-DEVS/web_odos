import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";
import { getServerQueryClient } from "@/libs/query-client.server";
import { catalogQueries } from "@/services/queries";
import type { Store } from "@/types/catalog";

/** Chat is addressed by store id, but the URL carries the slug — resolved against the store list. */
async function loadStore(slug: string): Promise<Store | undefined> {
  const stores = await getServerQueryClient().fetchQuery(catalogQueries.stores());
  return stores.find((s) => s.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/stores/[slug]/chat">): Promise<Metadata> {
  const { slug } = await params;
  const store = await loadStore(slug);
  if (!store) return {};
  return { title: `Chat with ${store.name}` };
}

export default async function StoreChatPage({ params }: PageProps<"/stores/[slug]/chat">) {
  const { slug } = await params;
  const store = await loadStore(slug);
  if (!store) notFound();

  // The thread and its messages are private, so they are fetched client-side after login.
  return <ChatView store={store} />;
}
