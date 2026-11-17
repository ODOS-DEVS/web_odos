import type { Metadata } from "next";
import { ProductEditView } from "@/components/vendor/products/product-edit-view";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/seller/products/[id]">) {
  const { id } = await params;
  return <ProductEditView productId={id} />;
}
