import glamapLogo from "/glamap-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Sparkles, Heart } from "lucide-react";
import { SignInButton } from "@clerk/clerk-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-background to-purple-50 dark:from-pink-950/20 dark:via-background dark:to-purple-950/20 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl shadow-primary/10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img src={glamapLogo} alt="Glamap" className="h-28" />
            </div>
            <CardTitle className="text-2xl font-display">Welcome to Glamap</CardTitle>
            <CardDescription className="text-base">
              Discover and connect with freelance beauty professionals near you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span>Find beauty artists in your area</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span>Book lashes, nails, makeup & more</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary" />
                </div>
                <span>Support local beauty businesses</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <SignInButton mode="modal">
                <Button className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/25" data-testid="button-sign-in">
                  Sign In to Glamap
                </Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button variant="outline" className="w-full h-12 text-base font-semibold rounded-xl" data-testid="button-sign-up">
                  Create an Account
                </Button>
              </SignInButton>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              By continuing, you agree to Glamap's Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        © 2026 Glamap. All rights reserved.
      </footer>
    </div>
  );
}
