import { Suspense } from "react";
import { Navbar } from "../../../components/navbar";
import { Footer } from "../../../components/footer";
import { ProductDetailClient } from "./product-detail-client";

/**
 * Product detail page — uses [slug] param (not UUID) for SEO.
 *
 * TODO: [product-svc] When connecting to real API, fetch product via:
 *   GET {API_GATEWAY}/products/by-slug/:slug  (product-svc)
 * Currently uses mock data from lib/products-data.ts keyed by slug-like ID.
 */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  // slug used as mock ID lookup — in production will call GET /products/by-slug/:slug
  const slug = resolvedParams.slug;

  return (
    <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<div className="p-12 text-center text-slate-gray font-medium">กำลังโหลดรายละเอียดสินค้า...</div>}>
          <ProductDetailClient productSlug={slug} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
