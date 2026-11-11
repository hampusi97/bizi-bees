import { db } from './index.ts';
import { users, fleetStores, storeOrders, entries } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { supabase } from '@/src/lib/supabase';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    if (process.env.SQL_HOST && process.env.SQL_PASSWORD) {
      const result = await db
        .insert(users)
        .values({
          uid,
          email,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
          },
        })
        .returning();

      return result[0];
    }
  } catch (error) {
    console.warn('Direct SQL query fallback to Supabase REST for getOrCreateUser:', error);
  }

  const { data } = await supabase
    .from('users')
    .upsert({ uid, email }, { onConflict: 'uid' })
    .select();
  return data ? data[0] : { uid, email };
}

export async function getFleetStoresFromDb() {
  try {
    if (process.env.SQL_HOST && process.env.SQL_PASSWORD) {
      return await db.select().from(fleetStores);
    }
  } catch (error) {
    console.warn('Direct SQL query fallback to Supabase REST for getFleetStoresFromDb:', error);
  }

  const { data } = await supabase
    .from('fleet_stores')
    .select('*')
    .order('id', { ascending: true });
  return (data || []).map((row: any) => ({
    ...row,
    storeSlug: row.store_slug || row.storeSlug,
    heroProduct: row.hero_product || row.heroProduct,
    soloPrice: row.solo_price || row.soloPrice,
    bundlePrice: row.bundle_price || row.bundlePrice,
    masterPrice: row.master_price || row.masterPrice,
    freeGift: row.free_gift || row.freeGift,
    accentColor: row.accent_color || row.accentColor,
    revenue24h: row.revenue_24h || row.revenue24h,
    orders24h: row.orders_24h ?? row.orders24h,
    conversionRate: row.conversion_rate || row.conversionRate,
    seoArticlesCount: row.seo_articles_count ?? row.seoArticlesCount,
    auditScore: row.audit_score ?? row.auditScore,
    lastHealed: row.last_healed || row.lastHealed,
  }));
}

export async function upsertFleetStoreInDb(storeData: {
  storeSlug: string;
  name: string;
  niche: string;
  domain: string;
  heroProduct: string;
  soloPrice: string;
  bundlePrice: string;
  masterPrice: string;
  freeGift: string;
  accentColor: string;
  revenue24h: string;
  orders24h: number;
  aov: string;
  conversionRate: string;
  status: string;
  seoArticlesCount: number;
  auditScore: number;
  lastHealed: string;
}) {
  try {
    if (process.env.SQL_HOST && process.env.SQL_PASSWORD) {
      const result = await db
        .insert(fleetStores)
        .values(storeData)
        .onConflictDoUpdate({
          target: fleetStores.storeSlug,
          set: {
            name: storeData.name,
            niche: storeData.niche,
            domain: storeData.domain,
            heroProduct: storeData.heroProduct,
            soloPrice: storeData.soloPrice,
            bundlePrice: storeData.bundlePrice,
            masterPrice: storeData.masterPrice,
            freeGift: storeData.freeGift,
            accentColor: storeData.accentColor,
            revenue24h: storeData.revenue24h,
            orders24h: storeData.orders24h,
            aov: storeData.aov,
            conversionRate: storeData.conversionRate,
            status: storeData.status,
            seoArticlesCount: storeData.seoArticlesCount,
            auditScore: storeData.auditScore,
            lastHealed: storeData.lastHealed,
          },
        })
        .returning();
      return result[0];
    }
  } catch (error) {
    console.warn('Direct SQL query fallback to Supabase REST for upsertFleetStoreInDb:', error);
  }

  const { data } = await supabase
    .from('fleet_stores')
    .upsert({
      store_slug: storeData.storeSlug,
      name: storeData.name,
      niche: storeData.niche,
      domain: storeData.domain,
      hero_product: storeData.heroProduct,
      solo_price: storeData.soloPrice,
      bundle_price: storeData.bundlePrice,
      master_price: storeData.masterPrice,
      free_gift: storeData.freeGift,
      accent_color: storeData.accentColor,
      revenue_24h: storeData.revenue24h,
      orders_24h: storeData.orders24h,
      aov: storeData.aov,
      conversion_rate: storeData.conversionRate,
      status: storeData.status,
      seo_articles_count: storeData.seoArticlesCount,
      audit_score: storeData.auditScore,
      last_healed: storeData.lastHealed,
    }, { onConflict: 'store_slug' })
    .select();
  return data ? data[0] : storeData;
}

export async function insertStoreOrderInDb(orderData: {
  orderNumber: string;
  storeSlug: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  tierLabel: string;
  totalAmount: string;
  freeGift: string;
  userId?: number | null;
}) {
  try {
    if (process.env.SQL_HOST && process.env.SQL_PASSWORD) {
      const result = await db
        .insert(storeOrders)
        .values({
          orderNumber: orderData.orderNumber,
          storeSlug: orderData.storeSlug,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          shippingAddress: orderData.shippingAddress,
          tierLabel: orderData.tierLabel,
          totalAmount: orderData.totalAmount,
          freeGift: orderData.freeGift,
          userId: orderData.userId ?? null,
        })
        .onConflictDoNothing()
        .returning();
      return result[0];
    }
  } catch (error) {
    console.warn('Direct SQL query fallback to Supabase REST for insertStoreOrderInDb:', error);
  }

  const { data } = await supabase
    .from('store_orders')
    .upsert({
      order_number: orderData.orderNumber,
      store_slug: orderData.storeSlug,
      customer_name: orderData.customerName,
      customer_email: orderData.customerEmail,
      shipping_address: orderData.shippingAddress,
      tier_label: orderData.tierLabel,
      total_amount: orderData.totalAmount,
      free_gift: orderData.freeGift,
      user_id: orderData.userId ?? null,
    }, { onConflict: 'order_number' })
    .select();
  return data ? data[0] : orderData;
}

export async function getRecentOrdersFromDb(limitCount = 20) {
  try {
    if (process.env.SQL_HOST && process.env.SQL_PASSWORD) {
      return await db
        .select()
        .from(storeOrders)
        .orderBy(desc(storeOrders.createdAt))
        .limit(limitCount);
    }
  } catch (error) {
    console.warn('Direct SQL query fallback to Supabase REST for getRecentOrdersFromDb:', error);
  }

  const { data } = await supabase
    .from('store_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitCount);
  return data || [];
}

export async function insertUserEntryInDb(entryData: {
  userId: number;
  storeSlug: string;
  actionType: string;
  content: string;
  date: string;
}) {
  try {
    if (process.env.SQL_HOST && process.env.SQL_PASSWORD) {
      const result = await db
        .insert(entries)
        .values(entryData)
        .returning();
      return result[0];
    }
  } catch (error) {
    console.warn('Direct SQL query fallback to Supabase REST for insertUserEntryInDb:', error);
  }

  const { data } = await supabase
    .from('entries')
    .insert({
      user_id: entryData.userId,
      store_slug: entryData.storeSlug,
      action_type: entryData.actionType,
      content: entryData.content,
      date: entryData.date,
    })
    .select();
  return data ? data[0] : entryData;
}

export async function getUserEntriesFromDb(uid: string) {
  try {
    if (process.env.SQL_HOST && process.env.SQL_PASSWORD) {
      return await db
        .select({
          id: entries.id,
          storeSlug: entries.storeSlug,
          actionType: entries.actionType,
          content: entries.content,
          date: entries.date,
          createdAt: entries.createdAt,
        })
        .from(entries)
        .innerJoin(users, eq(entries.userId, users.id))
        .where(eq(users.uid, uid))
        .orderBy(desc(entries.createdAt));
    }
  } catch (error) {
    console.warn('Direct SQL query fallback to Supabase REST for getUserEntriesFromDb:', error);
  }

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('uid', uid)
      .single();

    if (!userData) return [];

    const { data } = await supabase
      .from('entries')
      .select('id, store_slug, action_type, content, date, created_at')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });

    return (data || []).map((row: any) => ({
      id: row.id,
      storeSlug: row.store_slug,
      actionType: row.action_type,
      content: row.content,
      date: row.date,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('Failed to retrieve user entries from Supabase:', err);
    return [];
  }
}
