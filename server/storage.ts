import { db } from "./db";
import {
  profiles, services, reviews, messages, notifications, pageVisits,
  type InsertProfile, type InsertService, type InsertReview, type InsertMessage, type InsertNotification,
  type Profile, type Service, type Review, type Message, type Notification
} from "@shared/schema";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { authStorage } from "./clerk_auth/storage";

export interface IStorage {
  // Profiles
  getProfile(id: number): Promise<Profile | undefined>;
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  getProfileByUsername(username: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile & { userId: string }): Promise<Profile>;
  updateProfile(id: number, updates: Partial<InsertProfile>): Promise<Profile>;
  deleteProfile(id: number): Promise<void>;
  listProfiles(filters?: { services?: string[], search?: string }): Promise<(Profile & { services: Service[] })[]>;
  
  // Admin
  getAdminStats(): Promise<{
    totalUsers: number;
    totalProviders: number;
    totalClients: number;
    messagesSent: number;
    providersByLocationType: { locationType: string; count: number }[];
  }>;
  getAllProfiles(): Promise<Profile[]>;
  adminDeleteProfile(id: number): Promise<void>;

  // Services
  getServicesByProvider(providerId: number): Promise<Service[]>;
  getServiceByNameAndProvider(name: string, providerId: number): Promise<Service | undefined>;
  createService(service: InsertService & { providerId: number }): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Reviews
  createReview(review: InsertReview & { clientId: number }): Promise<Review>;
  getReviewsByProvider(providerId: number): Promise<Review[]>;
  getReview(id: number): Promise<Review | undefined>;
  getReviewByClientAndProvider(clientId: number, providerId: number): Promise<Review | undefined>;
  deleteReview(id: number): Promise<void>;

  // Messages
  createMessage(message: InsertMessage & { senderId: number }): Promise<Message>;
  getMessages(userId1: number, userId2: number): Promise<Message[]>;
  getConversations(userId: number): Promise<any[]>;
  deleteMessage(id: number): Promise<void>;
  deleteConversation(userId1: number, userId2: number): Promise<void>;
  getMessage(id: number): Promise<Message | undefined>;

  // Notifications
  getNotifications(profileId: number): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification & { profileId: number }): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  clearAllNotifications(profileId: number): Promise<void>;

  // Page Visits
  recordPageVisit(): Promise<void>;
  getPageVisitCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async getProfileByUserId(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async getProfileByUsername(username: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.username, username));
    return profile;
  }

  async createProfile(profile: InsertProfile & { userId: string }): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(id: number, updates: Partial<Profile>): Promise<Profile> {
    const [updated] = await db.update(profiles).set(updates).where(eq(profiles.id, id)).returning();
    return updated;
  }

  async deleteProfile(id: number): Promise<void> {
    // Delete related data first
    await db.delete(services).where(eq(services.providerId, id));
    await db.delete(reviews).where(eq(reviews.providerId, id));
    await db.delete(reviews).where(eq(reviews.clientId, id));
    await db.delete(messages).where(eq(messages.senderId, id));
    await db.delete(messages).where(eq(messages.receiverId, id));
    await db.delete(notifications).where(eq(notifications.profileId, id));
    await db.delete(profiles).where(eq(profiles.id, id));
  }

  async listProfiles(filters?: { services?: string[], search?: string, locationTypes?: string[] }): Promise<(Profile & { services: Service[] })[]> {
    // Fetch all profiles first, then filter in memory for more flexible search
    // This allows us to search across services as well
    const allProfiles = await db.select().from(profiles);
    const result: (Profile & { services: Service[] })[] = [];

    for (const p of allProfiles) {
      // Only include providers in the directory listing
      if (p.role !== 'provider') {
        continue;
      }
      
      const pServices = await db.select().from(services).where(eq(services.providerId, p.id));
      
      // Apply search filter - search in username, bio, location, service names, and service descriptions
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesUsername = p.username?.toLowerCase().includes(searchLower);
        const matchesBio = p.bio?.toLowerCase().includes(searchLower);
        const matchesLocation = p.location?.toLowerCase().includes(searchLower);
        const matchesServiceName = pServices.some(s => s.name.toLowerCase().includes(searchLower));
        const matchesServiceDesc = pServices.some(s => s.description?.toLowerCase().includes(searchLower));
        
        if (!matchesUsername && !matchesBio && !matchesLocation && !matchesServiceName && !matchesServiceDesc) {
          continue;
        }
      }
      
      // Apply service category filter - match ANY of the selected services
      if (filters?.services && filters.services.length > 0) {
        const matchesAnyService = filters.services.some(filterService => 
          pServices.some(s => s.name.toLowerCase().includes(filterService.toLowerCase()))
        );
        if (!matchesAnyService) {
          continue;
        }
      }
      
      // Apply location type filter - match ANY of the selected location types
      if (filters?.locationTypes && filters.locationTypes.length > 0) {
        if (!p.locationType || !filters.locationTypes.includes(p.locationType)) {
          continue;
        }
      }
      
      result.push({ ...p, services: pServices });
    }

    return result;
  }

  async getServicesByProvider(providerId: number): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.providerId, providerId));
  }

  async getServiceByNameAndProvider(name: string, providerId: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(and(eq(services.name, name), eq(services.providerId, providerId)));
    return service;
  }

  async createService(service: InsertService & { providerId: number }): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async createReview(review: InsertReview & { clientId: number }): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    
    // Update provider rating
    const providerReviews = await this.getReviewsByProvider(review.providerId);
    const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
    
    await this.updateProfile(review.providerId, {
        rating: avgRating,
        reviewCount: providerReviews.length
    });

    return newReview;
  }

  async getReviewsByProvider(providerId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.providerId, providerId)).orderBy(desc(reviews.createdAt));
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async getReviewByClientAndProvider(clientId: number, providerId: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(
      and(eq(reviews.clientId, clientId), eq(reviews.providerId, providerId))
    );
    return review;
  }

  async deleteReview(id: number): Promise<void> {
    const review = await this.getReview(id);
    if (review) {
      await db.delete(reviews).where(eq(reviews.id, id));
      // Recalculate provider rating
      const providerReviews = await this.getReviewsByProvider(review.providerId);
      const avgRating = providerReviews.length > 0 
        ? providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length 
        : 0;
      await db.update(profiles).set({ 
        rating: avgRating, 
        reviewCount: providerReviews.length 
      }).where(eq(profiles.id, review.providerId));
    }
  }

  async createMessage(message: InsertMessage & { senderId: number }): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessages(userId1: number, userId2: number): Promise<Message[]> {
    return await db.select().from(messages).where(
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    ).orderBy(messages.createdAt);
  }

  async getConversations(userId: number): Promise<Message[]> {
    // Return all messages for this user (sent and received)
    // Frontend will group them into conversations
    const sent = await db.select().from(messages).where(eq(messages.senderId, userId));
    const received = await db.select().from(messages).where(eq(messages.receiverId, userId));
    
    return [...sent, ...received].sort((a, b) => 
      new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
    );
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async deleteConversation(userId1: number, userId2: number): Promise<void> {
    await db.delete(messages).where(
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    );
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getNotifications(profileId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.profileId, profileId))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(notification: InsertNotification & { profileId: number }): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async clearAllNotifications(profileId: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.profileId, profileId));
  }

  // Admin methods
  async getAdminStats(): Promise<{
    totalUsers: number;
    totalProviders: number;
    totalClients: number;
    messagesSent: number;
    providersByLocationType: { locationType: string; count: number }[];
  }> {
    const allProfiles = await db.select().from(profiles);
    const totalUsers = allProfiles.length;
    const totalProviders = allProfiles.filter(p => p.role === 'provider').length;
    const totalClients = allProfiles.filter(p => p.role === 'client').length;

    const allMessages = await db.select().from(messages);
    const messagesSent = allMessages.length;

    // Group providers by location type
    const locationTypeCounts: Record<string, number> = {};
    allProfiles.filter(p => p.role === 'provider' && p.locationType).forEach(p => {
      const lt = p.locationType || 'unknown';
      locationTypeCounts[lt] = (locationTypeCounts[lt] || 0) + 1;
    });

    const providersByLocationType = Object.entries(locationTypeCounts).map(([locationType, count]) => ({
      locationType,
      count,
    }));

    return {
      totalUsers,
      totalProviders,
      totalClients,
      messagesSent,
      providersByLocationType,
    };
  }

  async getAllProfiles(): Promise<Profile[]> {
    return await db.select().from(profiles).orderBy(desc(profiles.id));
  }

  async adminDeleteProfile(id: number): Promise<void> {
    // Delete all related data
    await db.delete(services).where(eq(services.providerId, id));
    await db.delete(reviews).where(or(eq(reviews.providerId, id), eq(reviews.clientId, id)));
    await db.delete(messages).where(or(eq(messages.senderId, id), eq(messages.receiverId, id)));
    await db.delete(notifications).where(eq(notifications.profileId, id));
    await db.delete(profiles).where(eq(profiles.id, id));
  }

  async recordPageVisit(): Promise<void> {
    await db.insert(pageVisits).values({});
  }

  async getPageVisitCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(pageVisits);
    return result[0]?.count ?? 0;
  }
}

export const storage = new DatabaseStorage();
