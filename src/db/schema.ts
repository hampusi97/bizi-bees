import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table using Firebase Auth UID as unique identifier
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15-Store Fleet Telemetry & Audit table
export const fleetStores = pgTable('fleet_stores', {
  id: serial('id').primaryKey(),
  storeSlug: text('store_slug').notNull().unique(),
  name: text('name').notNull(),
  niche: text('niche').notNull(),
  domain: text('domain').notNull(),
  heroProduct: text('hero_product').notNull(),
  soloPrice: text('solo_price').notNull(),
  bundlePrice: text('bundle_price').notNull(),
  masterPrice: text('master_price').notNull(),
  freeGift: text('free_gift').notNull(),
  accentColor: text('accent_color').notNull(),
  revenue24h: text('revenue_24h').notNull(),
  orders24h: integer('orders_24h').notNull(),
  aov: text('aov').notNull(),
  conversionRate: text('conversion_rate').notNull(),
  status: text('status').notNull(),
  seoArticlesCount: integer('seo_articles_count').notNull(),
  auditScore: integer('audit_score').notNull(),
  lastHealed: text('last_healed').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Storefront Customer Orders table
export const storeOrders = pgTable('store_orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  storeSlug: text('store_slug').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  tierLabel: text('tier_label').notNull(),
  totalAmount: text('total_amount').notNull(),
  freeGift: text('free_gift').notNull(),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Fleet Autonomous & User Audit Entries table
export const entries = pgTable('entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  storeSlug: text('store_slug').notNull(),
  actionType: text('action_type').notNull(),
  content: text('content').notNull(),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  entries: many(entries),
  orders: many(storeOrders),
}));

export const entriesRelations = relations(entries, ({ one }) => ({
  author: one(users, {
    fields: [entries.userId],
    references: [users.id],
  }),
}));

export const storeOrdersRelations = relations(storeOrders, ({ one }) => ({
  customer: one(users, {
    fields: [storeOrders.userId],
    references: [users.id],
  }),
}));
