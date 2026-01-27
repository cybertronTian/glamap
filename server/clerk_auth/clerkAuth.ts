import { verifyToken } from '@clerk/backend';
import type { Express, RequestHandler } from "express";
import { authStorage } from "./storage";

const SECRET_KEY = process.env.CLERK_SECRET_KEY!;

export function getSession() {
  // Clerk handles sessions via JWT tokens, no need for express-session
  return null;
}

async function upsertUser(clerkUser: any) {
  await authStorage.upsertUser({
    id: clerkUser.id,
    email: clerkUser.emailAddresses?.[0]?.emailAddress,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    profileImageUrl: clerkUser.imageUrl,
  });
}

export async function setupAuth(app: Express) {
  // Clerk middleware for verifying JWT tokens
  app.use(async (req: any, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '') ||
                  req.cookies?.__session;

    if (token) {
      try {
        const payload = await verifyToken(token, { secretKey: SECRET_KEY });
        req.user = payload;

        // Sync user data from JWT payload
        await upsertUser({
          id: payload.sub,
          email: payload.email,
          firstName: payload.firstName || payload.given_name,
          lastName: payload.lastName || payload.family_name,
          profileImageUrl: payload.imageUrl || payload.picture,
        });
      } catch (error) {
        // Token invalid, continue without user
      }
    }
    next();
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function getUserFromToken(token: string) {
  try {
    return await verifyToken(token, { secretKey: SECRET_KEY });
  } catch {
    return null;
  }
}