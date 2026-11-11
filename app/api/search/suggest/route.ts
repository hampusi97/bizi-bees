import { NextRequest, NextResponse } from "next/server";
import { INITIAL_STORES, getStoreById } from "@/lib/stores-catalog";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const storeIdParam = searchParams.get("storeId") || "";

  const targetStores = storeIdParam
    ? [getStoreById(storeIdParam)].filter(Boolean)
    : INITIAL_STORES;

  const allProducts = targetStores.flatMap((store) =>
    (store ? store.products : []).map((product, index) => ({
      id: product.id,
      title: product.title,
      category: product.department || product.category,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      inStockCount: product.inStockCount || 18,
      sku: product.sku || `${store!.id.toUpperCase()}-0${index + 1}`,
      storeId: store!.id,
      storeName: store!.name,
      accentColor: store!.accentColor,
      secondaryColor: store!.secondaryColor,
      productIndex: index,
    }))
  );

  const matches = !q
    ? allProducts.slice(0, 6)
    : allProducts
        .filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.storeName.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q)
        )
        .slice(0, 8);

  return NextResponse.json({
    success: true,
    query: q,
    results: matches,
  });
}
