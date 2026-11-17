import type { Metadata } from "next";
import { PageHeader } from "@/components/vendor/vendor-ui";
import { ProductForm } from "@/components/vendor/products/product-form";

export const metadata: Metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Add product" description="It goes live on the ODOS storefront as soon as you save." />
      <ProductForm />
    </div>
  );
}
