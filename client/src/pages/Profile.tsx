import { useProfile, useCreateReview, useMyProfile, useCheckExistingReview, useDeleteReview } from "@/hooks/use-profiles";
import { shortenLocation } from "@/lib/utils";
import { useSendMessage } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";
import { useRoute, Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, MapPin, Clock, MessageCircle, Share2, ShieldCheck, Loader2, Instagram, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { insertReviewSchema } from "@shared/schema";

// Form Schema for Review
const reviewFormSchema = insertReviewSchema.omit({ clientId: true, providerId: true });
type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export default function ProfilePage() {
  const [match, params] = useRoute("/profile/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  
  const { data: profile, isLoading } = useProfile(id);
  const { data: myProfile } = useMyProfile();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const isOwnProfile = myProfile?.id === id;
  
  const sendMessage = useSendMessage();
  const createReview = useCreateReview();
  const deleteReview = useDeleteReview();
  
  const { data: existingReviewCheck } = useCheckExistingReview(
    isAuthenticated && myProfile?.id !== profile?.id ? profile?.id : undefined
  );

  const [messageOpen, setMessageOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [messageText, setMessageText] = useState("");

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 5,
      comment: "",
      displayName: "",
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessage.mutate(
      { receiverId: profile.id, content: messageText },
      {
        onSuccess: () => {
          toast({ title: "Message sent!", description: "Check your inbox for replies." });
          setMessageOpen(false);
          setMessageText("");
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
        }
      }
    );
  };

  const onReviewSubmit = (values: ReviewFormValues) => {
    createReview.mutate(
      { ...values, providerId: profile.id },
      {
        onSuccess: () => {
          toast({ title: "Review submitted!", description: "Thank you for your feedback." });
          setReviewOpen(false);
          form.reset();
        },
        onError: (error) => {
          toast({ title: "Error", description: error.message || "Failed to submit review", variant: "destructive" });
        }
      }
    );
  };

  const handleDeleteReview = (reviewId: number) => {
    deleteReview.mutate(
      { reviewId, providerId: profile.id },
      {
        onSuccess: () => {
          toast({ title: "Review deleted", description: "Your review has been removed." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete review", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      <div className="container mx-auto px-3 sm:px-4 pt-6 sm:pt-10 relative z-10">
        <div className="bg-card rounded-2xl sm:rounded-3xl shadow-xl border border-border/50 p-4 sm:p-6 md:p-10 flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          
          {/* Profile Left */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:min-w-[200px] md:w-auto">
            <div className="relative">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-card shadow-lg mb-3 sm:mb-4">
                {profile.profileImageUrl && <AvatarImage src={profile.profileImageUrl} alt={profile.username} />}
                <AvatarFallback className="bg-secondary text-3xl sm:text-4xl font-display font-bold text-secondary-foreground">
                  {profile.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-3 sm:bottom-4 right-0 bg-green-500 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-4 border-card" />
            </div>
            
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">{profile.username}</h1>
            <Badge variant={profile.role === 'provider' ? 'default' : 'secondary'} className="mb-2">
              {profile.role === 'provider' ? 'Service Provider' : 'Client'}
            </Badge>
            {profile.role === 'provider' && (
              <p className="text-muted-foreground text-sm sm:text-base flex items-center justify-center md:justify-start gap-1 mb-4">
                <MapPin size={14} /> {profile.locationType?.replace('_', ' ')} • {shortenLocation(profile.location)}
              </p>
            )}

            <div className="flex gap-2 w-full">
              {!isOwnProfile && (
                isAuthenticated && myProfile ? (
                  <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex-1 rounded-xl font-bold shadow-lg shadow-primary/25">
                        <MessageCircle className="mr-2 h-4 w-4" /> Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Message {profile.username}</DialogTitle>
                        <DialogDescription>Send a message to inquire about services or book an appointment.</DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Textarea 
                          placeholder="Hi! I'm interested in booking a service..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          className="min-h-[150px]"
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSendMessage} disabled={sendMessage.isPending}>
                          {sendMessage.isPending ? "Sending..." : "Send Message"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : isAuthenticated && !myProfile ? (
                  <Link href="/onboarding" className="flex-1">
                     <Button className="w-full rounded-xl font-bold">Complete Profile to Message</Button>
                  </Link>
                ) : (
                  <Link href="/login" className="flex-1">
                     <Button className="w-full rounded-xl font-bold">Sign In to Message</Button>
                  </Link>
                )
              )}
              {profile.instagram && (
                <a 
                  href={`https://instagram.com/${profile.instagram.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="icon" className="rounded-xl border-2" data-testid="button-instagram">
                    <Instagram className="h-4 w-4" />
                  </Button>
                </a>
              )}
              {profile.role === 'provider' && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-xl border-2"
                  data-testid="button-share"
                  onClick={async () => {
                    const shareUrl = window.location.href;
                    const shareData = {
                      title: `${profile.username} on Glamap`,
                      text: `Check out ${profile.username}'s beauty services on Glamap!`,
                      url: shareUrl,
                    };
                    
                    if (navigator.share) {
                      try {
                        await navigator.share(shareData);
                      } catch (err) {
                        // User cancelled or share failed, fall back to clipboard
                        await navigator.clipboard.writeText(shareUrl);
                        toast({ title: "Link copied!", description: "Profile link copied to clipboard" });
                      }
                    } else {
                      await navigator.clipboard.writeText(shareUrl);
                      toast({ title: "Link copied!", description: "Profile link copied to clipboard" });
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Profile Right - Content */}
          <div className="flex-1 w-full">
            {profile.role === 'provider' && (
              <>
                <div className="flex gap-8 border-b border-border pb-6 mb-6">
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold font-display">{profile.rating?.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Rating</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold font-display">{profile.reviewCount}</div>
                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Reviews</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold font-display">{profile.services.length}</div>
                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Services</div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-bold text-lg mb-2">About</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {profile.bio || "This provider hasn't written a bio yet."}
                  </p>
                </div>
              </>
            )}

            {profile.role === 'provider' ? (
             <Tabs defaultValue="services" className="w-full">
               <TabsList className="w-full justify-start bg-transparent border-b border-border p-0 h-auto rounded-none gap-8">
                 <TabsTrigger value="services" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">Services</TabsTrigger>
                 <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 font-bold text-muted-foreground data-[state=active]:text-foreground transition-all">Reviews</TabsTrigger>
               </TabsList>
               
               <TabsContent value="services" className="mt-6 space-y-4">
                 {profile.services.map(service => (
                   <div key={service.id} className="flex justify-between items-center p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
                     <div>
                       <h4 className="font-bold">{service.name}</h4>
                       <p className="text-sm text-muted-foreground">{service.description}</p>
                       {service.duration && (
                         <div className="flex items-center gap-2 mt-1 text-xs font-medium text-muted-foreground">
                           <Clock size={12} /> {service.duration} mins
                         </div>
                       )}
                     </div>
                     <div className="text-right">
                       {service.price && (
                         <span className="block text-lg font-bold font-display text-primary">${service.price}</span>
                       )}
                     </div>
                   </div>
                 ))}
                 {profile.services.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      No services listed yet.
                    </div>
                 )}
               </TabsContent>

               <TabsContent value="reviews" className="mt-6">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-lg">Client Reviews</h3>
                   {isAuthenticated && user?.id !== profile.userId && !existingReviewCheck?.hasReviewed && (
                     <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" data-testid="button-write-review">Write a Review</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review {profile.username}</DialogTitle>
                            <DialogDescription>Share your experience with this provider.</DialogDescription>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onReviewSubmit)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                  <FormItem>
                                    <Label>Display Name</Label>
                                    <FormControl>
                                      <Input {...field} value={field.value || ""} placeholder="Anonymous" data-testid="input-display-name" />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">Leave blank to appear as "Anonymous"</p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="rating"
                                render={({ field }) => (
                                  <FormItem>
                                    <Label>Rating</Label>
                                    <FormControl>
                                      <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() => field.onChange(star)}
                                            className={`${star <= field.value ? 'text-amber-400' : 'text-muted'} hover:scale-110 transition-transform`}
                                            data-testid={`button-star-${star}`}
                                          >
                                            <Star className="fill-current w-8 h-8" />
                                          </button>
                                        ))}
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="comment"
                                render={({ field }) => (
                                  <FormItem>
                                    <Label>Comment <span className="text-muted-foreground text-sm">(optional)</span></Label>
                                    <FormControl>
                                      <Textarea {...field} value={field.value || ""} placeholder="Share your experience..." data-testid="input-review-comment" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" className="w-full" disabled={createReview.isPending} data-testid="button-submit-review">
                                {createReview.isPending ? "Submitting..." : "Submit Review"}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                     </Dialog>
                   )}
                   {isAuthenticated && existingReviewCheck?.hasReviewed && (
                     <span className="text-sm text-muted-foreground">You've already reviewed this provider</span>
                   )}
                 </div>

                 <div className="space-y-6">
                   {profile.reviews?.map((review) => (
                     <div key={review.id} className="border-b border-border/50 pb-6 last:border-0" data-testid={`review-${review.id}`}>
                       <div className="flex justify-between mb-2">
                         <div className="font-bold flex items-center gap-2">
                            <span className="text-primary font-display">{review.displayName || "Anonymous"}</span>
                            <span className="text-xs text-muted-foreground font-normal bg-secondary px-2 py-0.5 rounded-full">Verified</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="flex text-amber-400">
                             {Array.from({ length: 5 }).map((_, i) => (
                               <Star key={i} size={14} className={i < review.rating ? "fill-current" : "text-muted fill-muted"} />
                             ))}
                           </div>
                           {myProfile?.id === review.clientId && (
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-7 w-7 text-muted-foreground hover:text-destructive"
                               onClick={() => handleDeleteReview(review.id)}
                               disabled={deleteReview.isPending}
                               data-testid={`button-delete-review-${review.id}`}
                             >
                               <Trash2 size={14} />
                             </Button>
                           )}
                         </div>
                       </div>
                       <p className="text-muted-foreground text-sm">{review.comment}</p>
                     </div>
                   ))}
                 </div>
               </TabsContent>
               
             </Tabs>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>This is a client profile.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
