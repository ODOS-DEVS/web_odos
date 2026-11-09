import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";
import { getServerQueryClient } from "@/libs/query-client.server";
import { first } from "@/libs/url";
import { catalogQueries } from "@/services/queries";

/** Stores are addressed by slug in URLs but by id in the API, so resolve the slug from the store list. */
async function findStore(slug: string) {
  const stores = await getServerQueryClient()
    .fetchQuery(catalogQueries.stores())
    .catch(() => []);
  // Chat threads for vendors missing from the list link here by store id.
  return stores.find((s) => s.slug === slug) ?? stores.find((s) => s.id === slug);
}

export async function generateMetadata({ params }: PageProps<"/stores/[slug]/chat">): Promise<Metadata> {
  const { slug } = await params;
  const store = await findStore(slug);
  if (!store) return {};
  return { title: `Chat with ${store.name}` };
}

export default async function StoreChatPage({ params, searchParams }: PageProps<"/stores/[slug]/chat">) {
  const { slug } = await params;
  const store = await findStore(slug);
  if (!store) notFound();

  const productId = first((await searchParams).product);
  return <ChatView store={store} productId={productId} />;
}
