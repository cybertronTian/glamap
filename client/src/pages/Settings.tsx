import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { useDeleteProfile } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { logout } = useAuth();
  const deleteProfile = useDeleteProfile();
  const { toast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") return;
    
    deleteProfile.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
        logout();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete account. Please try again.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 max-w-2xl">
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Settings</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that will permanently affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full" data-testid="button-delete-account">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-destructive">Delete Account</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account, profile, messages, reviews, and services.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
                    <Input
                      id="confirm-delete"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="mt-2"
                      data-testid="input-confirm-delete"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={confirmText !== "DELETE" || deleteProfile.isPending}
                      data-testid="button-confirm-delete"
                    >
                      {deleteProfile.isPending ? "Deleting..." : "Delete My Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
