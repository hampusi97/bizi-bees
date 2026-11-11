import { db } from './index.ts';
import { users, fleetStores, storeOrders, entries } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  try {
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
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getFleetStoresFromDb() {
  try {
    return await db.select().from(fleetStores);
  } catch (error) {
    console.error('Database query failed in getFleetStoresFromDb:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
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
  } catch (error) {
    console.error('Database query failed in upsertFleetStoreInDb:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
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
  } catch (error) {
    console.error('Database query failed in insertStoreOrderInDb:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getRecentOrdersFromDb(limitCount = 20) {
  try {
    return await db
      .select()
      .from(storeOrders)
      .orderBy(desc(storeOrders.createdAt))
      .limit(limitCount);
  } catch (error) {
    console.error('Database query failed in getRecentOrdersFromDb:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function insertUserEntryInDb(entryData: {
  userId: number;
  storeSlug: string;
  actionType: string;
  content: string;
  date: string;
}) {
  try {
    const result = await db
      .insert(entries)
      .values(entryData)
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in insertUserEntryInDb:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getUserEntriesFromDb(uid: string) {
  try {
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
  } catch (error) {
    console.error('Database query failed in getUserEntriesFromDb:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
