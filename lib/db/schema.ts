import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  json,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { 
  AIGeneratedContent, 
  JobStep, 
  ThemeConfig,
  ScrapedProduct 
} from '@/types';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

// ============================================
// Dropifi Schemas
// ============================================

// Shops table - stores Shopify store information
export const shops = pgTable('shops', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 255 }),
  myshopifyDomain: varchar('myshopify_domain', { length: 255 }).unique(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Shopify tokens table - stores OAuth tokens
export const shopifyTokens = pgTable('shopify_tokens', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id)
    .unique(),
  accessToken: text('access_token').notNull(),
  scope: text('scope').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Products table - stores scraped and processed products
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  shopId: integer('shop_id').references(() => shops.id),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  sourceUrl: text('source_url'),
  images: json('images').$type<string[]>().default([]),
  price: decimal('price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 10 }).default('USD'),
  scrapedData: json('scraped_data').$type<ScrapedProduct>(),
  shopifyProductId: varchar('shopify_product_id', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// AI Generations table - stores AI-generated content
export const aiGenerations = pgTable('ai_generations', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  generatedContent: json('generated_content').$type<AIGeneratedContent>(),
  model: varchar('model', { length: 100 }).default('gpt-4'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Generation Jobs table - stores store generation pipeline jobs
export const generationJobs = pgTable('generation_jobs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id),
  productId: integer('product_id').references(() => products.id),
  sourceUrl: text('source_url').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  currentStep: integer('current_step').default(0),
  steps: json('steps').$type<JobStep[]>().default([]),
  themeConfig: json('theme_config').$type<Partial<ThemeConfig>>(),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

// ============================================
// Dropifi Relations
// ============================================

export const shopsRelations = relations(shops, ({ one, many }) => ({
  user: one(users, {
    fields: [shops.userId],
    references: [users.id],
  }),
  shopifyToken: one(shopifyTokens),
  products: many(products),
  generationJobs: many(generationJobs),
}));

export const shopifyTokensRelations = relations(shopifyTokens, ({ one }) => ({
  shop: one(shops, {
    fields: [shopifyTokens.shopId],
    references: [shops.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  shop: one(shops, {
    fields: [products.shopId],
    references: [shops.id],
  }),
  aiGenerations: many(aiGenerations),
}));

export const aiGenerationsRelations = relations(aiGenerations, ({ one }) => ({
  product: one(products, {
    fields: [aiGenerations.productId],
    references: [products.id],
  }),
}));

export const generationJobsRelations = relations(generationJobs, ({ one }) => ({
  user: one(users, {
    fields: [generationJobs.userId],
    references: [users.id],
  }),
  shop: one(shops, {
    fields: [generationJobs.shopId],
    references: [shops.id],
  }),
  product: one(products, {
    fields: [generationJobs.productId],
    references: [products.id],
  }),
}));

// ============================================
// Dropifi Types
// ============================================

export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type ShopifyToken = typeof shopifyTokens.$inferSelect;
export type NewShopifyToken = typeof shopifyTokens.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type AIGeneration = typeof aiGenerations.$inferSelect;
export type NewAIGeneration = typeof aiGenerations.$inferInsert;
export type GenerationJob = typeof generationJobs.$inferSelect;
export type NewGenerationJob = typeof generationJobs.$inferInsert;
