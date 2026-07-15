import { Navbar } from "../../components/navbar";
import { Footer } from "../../components/footer";
import { ProductListClient } from "./product-list-client";
import { Suspense } from "react";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string; search?: string }>;
}) {
  const resolvedParams = await searchParams;
  const category = resolvedParams.category;
  const brand = resolvedParams.brand;
  const search = resolvedParams.search;

  // Default to guitars only if category, brand, and search are all missing
  const activeCategory = !category && !brand && !search ? "guitars" : category;

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      {/* Header / Navigation bar */}
      <Navbar />
      
      {/* Main page content wrapper */}
      <main className="flex-grow">
        <Suspense fallback={<div className="p-12 text-center text-slate-gray font-medium">กำลังโหลดสินค้า...</div>}>
          <ProductListClient initialCategory={activeCategory} initialBrand={brand} initialSearch={search} />
        </Suspense>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
