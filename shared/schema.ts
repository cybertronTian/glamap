import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/auth";

// Profiles extends the base auth user with app-specific data
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // Links to auth.users.id
  username: text("username").notNull().unique(),
  usernameChangedAt: timestamp("username_changed_at"), // Track when username was last changed
  role: text("role", { enum: ["client", "provider"] }).notNull().default("client"),
  isAdmin: boolean("is_admin").notNull().default(false), // Admin access
  bio: text("bio"),
  instagram: text("instagram"),
  profileImageUrl: text("profile_image_url"), // Profile picture URL from object storage
  location: text("location"), // Human readable address
  locationType: text("location_type", { enum: ["house", "apartment", "studio", "rented_space", "mobile"] }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"), // E.g. "50" or "50-100" - now optional
  duration: integer("duration"), // Minutes - now optional
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  clientId: integer("client_id").notNull(),
  displayName: text("display_name").default("Anonymous"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  read: boolean("read").default(false),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  type: text("type", { enum: ["message", "review", "booking", "system"] }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  link: text("link"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pageVisits = pgTable("page_visits", {
  id: serial("id").primaryKey(),
  visitedAt: timestamp("visited_at").defaultNow(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  services: many(services),
  reviewsReceived: many(reviews, { relationName: "reviewsReceived" }),
  reviewsWritten: many(reviews, { relationName: "reviewsWritten" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  provider: one(profiles, {
    fields: [services.providerId],
    references: [profiles.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  provider: one(profiles, {
    fields: [reviews.providerId],
    references: [profiles.id],
    relationName: "reviewsReceived",
  }),
  client: one(profiles, {
    fields: [reviews.clientId],
    references: [profiles.id],
    relationName: "reviewsWritten",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(profiles, {
    fields: [messages.senderId],
    references: [profiles.id],
    relationName: "sentMessages",
  }),
  receiver: one(profiles, {
    fields: [messages.receiverId],
    references: [profiles.id],
    relationName: "receivedMessages",
  }),
}));

// Zod Schemas
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, rating: true, reviewCount: true, isAdmin: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, providerId: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, read: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, read: true });

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
