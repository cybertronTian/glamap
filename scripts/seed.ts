import { db } from "../server/db";
import { profiles, services, reviews, users } from "../shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Create some users first (simulated since we can't easily create auth users with passwords)
  // In Clerk Auth, users are created on signup. We will simulate by inserting directly into 'users' table,
  // but 'users' table is managed by auth module.
  // Actually, we can just insert into 'profiles' with fake userIds.
  
  const provider1Id = "user_provider_1";
  const provider2Id = "user_provider_2";
  const clientId = "user_client_1";

  // Provider 1: Sarah's Studio
  await db.insert(profiles).values({
    userId: provider1Id,
    username: "sarah_beauty",
    role: "provider",
    bio: "Certified lash technician with 5 years experience. I work from my cozy home studio in Bondi.",
    instagram: "@sarah_lashes",
    location: "Bondi Beach, Sydney",
    locationType: "studio",
    latitude: -33.8915,
    longitude: 151.2767, // Bondi
    rating: 4.8,
    reviewCount: 12,
  }).onConflictDoNothing();

  const [p1] = await db.select().from(profiles).where(sql`user_id = ${provider1Id}`);

  if (p1) {
      await db.insert(services).values([
        { providerId: p1.id, name: "Classic Lashes", price: "80", duration: 90, description: "Natural looking lash extensions" },
        { providerId: p1.id, name: "Volume Lashes", price: "120", duration: 120, description: "Full and fluffy look" },
      ]).onConflictDoNothing();
  }

  // Provider 2: Glam Mobile
  await db.insert(profiles).values({
    userId: provider2Id,
    username: "glam_mobile",
    role: "provider",
    bio: "Mobile makeup artist for weddings and events across Sydney. I come to you!",
    instagram: "@glam_mobile_mua",
    location: "Greater Sydney Area",
    locationType: "mobile",
    latitude: -33.8688,
    longitude: 151.2093, // Sydney CBD
    rating: 5.0,
    reviewCount: 5,
  }).onConflictDoNothing();

  const [p2] = await db.select().from(profiles).where(sql`user_id = ${provider2Id}`);
  
  if (p2) {
      await db.insert(services).values([
        { providerId: p2.id, name: "Bridal Makeup", price: "150", duration: 60, description: "Full bridal glam" },
        { providerId: p2.id, name: "Event Makeup", price: "100", duration: 45, description: "Party/Event makeup" },
      ]).onConflictDoNothing();
  }

  // Client
  await db.insert(profiles).values({
    userId: clientId,
    username: "jessica_c",
    role: "client",
    bio: "Love beauty!",
    location: "Surry Hills",
    latitude: -33.8861,
    longitude: 151.2111,
  }).onConflictDoNothing();

  console.log("Seeding complete!");
}

seed().catch(console.error);
