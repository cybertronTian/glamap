import type { Express } from "express";
import { authStorage } from "./storage";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await authStorage.getUser(req.user.sub || req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Login route - redirect to Clerk
  app.get("/api/login", (req, res) => {
    // Redirect to Clerk's login page
    // In production, you'd use Clerk's SDK to get the login URL
    const clerkLoginUrl = `https://accounts.clerk.dev/sign-in?redirect_url=${encodeURIComponent(`${req.protocol}://${req.get('host')}/`)}`;
    res.redirect(clerkLoginUrl);
  });
}