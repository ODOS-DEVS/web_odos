import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Link href="/" className="text-2xl font-bold tracking-tight">
          odos<span className="text-accent">.</span>
        </Link>
        <p className="mt-10 text-sm font-medium text-accent">404</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">We couldn’t find that page</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          The link may be broken, or the product or store may have been removed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" size="lg">
            Back to home
          </ButtonLink>
          <ButtonLink href="/products" size="lg" variant="outline">
            Browse products
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
