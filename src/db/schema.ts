import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp
} from 'drizzle-orm/pg-core';

// Define the 'users' table using Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Define the 'quotations' table for UniqTek Quotation Data & Total Price Reporting
export const quotations = pgTable('quotations', {
  id: text('id').primaryKey(), // e.g., QT-20261005-12
  refNo: text('ref_no').notNull(), // e.g., 20261005-13
  revision: integer('revision').notNull().default(1),
  handledBy: text('handled_by').notNull().default('Mr Pheng BOUNMUECHANYA'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull().default('020 96 666 082'),
  deliveryTo: text('delivery_to').notNull(),
  deliveryLeadTime: text('delivery_lead_time').notNull().default('30 Days'),
  deliveryTerms: text('delivery_terms').notNull().default('Repair Service'),
  currency: text('currency').notNull().default('LAK'),
  date: text('date').notNull(),
  validity: text('validity').notNull().default('30 Days'),
  remark: text('remark').notNull().default(''),
  includeFreeInspection: boolean('include_free_inspection').notNull().default(true),
  terms: text('terms').notNull(),
  subtotal: doublePrecision('subtotal').notNull().default(0),
  vat: doublePrecision('vat').notNull().default(0),
  vatRate: doublePrecision('vat_rate').notNull().default(10),
  vatIncluded: boolean('vat_included').notNull().default(true),
  total: doublePrecision('total').notNull().default(0),
  showOfficialStamp: boolean('show_official_stamp').notNull().default(true),
  userUid: text('user_uid'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Define the 'quotation_items' table with foreign key to 'quotations'
export const quotationItems = pgTable('quotation_items', {
  id: text('id').primaryKey(),
  quotationId: text('quotation_id')
    .references(() => quotations.id, { onDelete: 'cascade' })
    .notNull(),
  description: text('description').notNull(),
  details: text('details').notNull().default(''),
  unit: text('unit').notNull().default('Pc'),
  qty: integer('qty').notNull().default(1),
  unitPrice: doublePrecision('unit_price').notNull().default(0),
  totalPrice: doublePrecision('total_price').notNull().default(0),
  isFree: boolean('is_free').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0)
});

export const usersRelations = relations(users, ({ many }) => ({
  quotations: many(quotations)
}));

export const quotationsRelations = relations(quotations, ({ many, one }) => ({
  items: many(quotationItems),
  author: one(users, {
    fields: [quotations.userUid],
    references: [users.uid]
  })
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id]
  })
}));
