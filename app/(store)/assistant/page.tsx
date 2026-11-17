import type { Metadata } from "next";
import { AssistantConversation } from "@/components/assistant/assistant-conversation";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "ODOS Assistant",
  description: "Ask the ODOS Assistant to find products, compare prices and point you to the right store.",
};

export default function AssistantPage() {
  return (
    <Container className="py-8 sm:py-10">
      <SectionHeading
        title="ODOS Assistant"
        description="Ask for products, prices or a store and I'll search the marketplace for you."
      />
      <div className="mt-6 flex h-[min(42rem,calc(100vh-16rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface">
        <AssistantConversation className="min-h-0 flex-1" autoFocus />
      </div>
    </Container>
  );
}
