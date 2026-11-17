"use client";

import Link from "next/link";
import { ArrowLeft, PackageX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { QueryError } from "@/components/ui/query-error";
import { PageHeader } from "@/components/vendor/vendor-ui";
import { ProductForm } from "./product-form";
import { useVendorProducts } from "@/hooks/use-vendor";

/**
 * There is no single-product vendor read endpoint, so the record comes out of the catalogue the
 * list page already holds. The full record matters here beyond display: the update is a
 * whole-record write, and a missing field is a silently cleared column.
 */
export function ProductEditView({ productId }: { productId: string }) {
  const query = useVendorProducts();

  if (query.isError) {
    return <QueryError title="We couldn't load this product" error={query.error} onRetry={() => query.refetch()} />;
  }
  if (query.isPending) {
    return <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />;
  }

  const product = query.data?.find((p) => p.id === productId);
  if (!product) {
    return (
      <EmptyState
        icon={<PackageX className="size-10 text-muted" aria-hidden />}
        title="Product not found"
        description="This product is not in your catalogue. It may have been deleted."
        action={<ButtonLink href="/seller/products">Back to products</ButtonLink>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/seller/products" className="press inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        All products
      </Link>
      <PageHeader title={product.name} description={`${product.category} · last updated ${new Date(product.updatedAt).toLocaleDateString()}`} />
      <ProductForm product={product} />
    </div>
  );
}
