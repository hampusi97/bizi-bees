import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://fnxxdjdskikbxavqclsy.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueHhkamRza2lrYnhhdnFjbHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NTY1MDEsImV4cCI6MjEwOTEzMjUwMX0.eNIY-05G5IJsMZ3ZK80HEDGO10jjK9wLk26FloB4nME";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch all synchronized stores directly from Supabase
 */
export async function getLiveFleetStores() {
  const { data, error } = await supabase
    .from("fleet_stores")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching fleet stores from Supabase:", error);
    return null;
  }
  return data;
}

/**
 * Fetch all TikTok Shop SKUs from Supabase
 */
export async function getLiveTikTokProducts(storeId?: string) {
  let query = supabase.from("tiktok_products").select("*");
  if (storeId && storeId !== "all") {
    query = query.eq("store_id", storeId);
  }
  const { data, error } = await query.order("id", { ascending: true });
  if (error) {
    console.error("Error fetching TikTok products from Supabase:", error);
    return null;
  }
  return data;
}

/**
 * Insert a customer checkout order into Supabase
 */
export async function insertStoreOrder(order: {
  orderNumber: string;
  storeSlug: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  tierLabel: string;
  totalAmount: string;
  freeGift: string;
}) {
  const { data, error } = await supabase.from("store_orders").insert([{
    order_number: order.orderNumber,
    store_slug: order.storeSlug,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    shipping_address: order.shippingAddress,
    tier_label: order.tierLabel,
    total_amount: order.totalAmount,
    free_gift: order.freeGift,
  }]);
  if (error) {
    console.error("Error inserting order into Supabase:", error);
    throw error;
  }
  return data;
}
