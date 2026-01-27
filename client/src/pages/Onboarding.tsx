import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProfileSchema } from "@shared/schema";
import { useCreateProfile, useCheckUsername, useMyProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Loader2, Check, X } from "lucide-react";

// Onboarding only needs username, role, and bio initially
const onboardingSchema = insertProfileSchema.omit({ 
  userId: true
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username too long"),
  role: z.enum(["client", "provider"]),
  bio: z.string().optional(),
  location: z.string().optional(),
  locationType: z.enum(["house", "apartment", "studio", "rented_space", "mobile"]).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useMyProfile();
  const createProfile = useCreateProfile();
  const checkUsername = useCheckUsername();
  const { toast } = useToast();
  
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Redirect if profile already exists
  useEffect(() => {
    if (!isProfileLoading && profile) {
      setLocation("/");
    }
  }, [profile, isProfileLoading, setLocation]);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: user?.firstName ? `${user.firstName.toLowerCase()}${user.lastName?.[0]?.toLowerCase() || ''}` : "",
      role: "client",
      bio: "",
      locationType: "house"
    },
  });

  // Debounced username check
  const watchedUsername = form.watch("username");
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (watchedUsername.length >= 3) {
        setCheckingUsername(true);
        try {
          const res = await checkUsername.mutateAsync(watchedUsername);
          setUsernameAvailable(res.available);
        } catch {
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [watchedUsername]);

  const onSubmit = (data: OnboardingValues) => {
    // If profile already exists, just go home
    if (profile) {
      setLocation("/");
      return;
    }
    
    // If provider, location is required in future steps, but for MVP we simplify
    createProfile.mutate(data, {
      onSuccess: () => {
        toast({ title: "Welcome to Glamap!", description: "Your profile has been created." });
        setLocation("/");
      },
      onError: (error) => {
        // If the error says it already exists, just redirect
        if (error.message.toLowerCase().includes("already exists")) {
          toast({ title: "Profile Found", description: "Taking you to your home page." });
          setLocation("/");
          return;
        }
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-border/50 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-display font-bold">Create your Profile</CardTitle>
          <CardDescription>
            Tell us a bit about yourself to get started on Glamap.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>I am here to...</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem value="client" id="client" className="peer sr-only" />
                          <Label
                            htmlFor="client"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                          >
                            <span className="text-2xl mb-2">💅</span>
                            <span className="font-bold text-center">Find Services</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="provider" id="provider" className="peer sr-only" />
                          <Label
                            htmlFor="provider"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                          >
                            <span className="text-2xl mb-2">💇‍♀️</span>
                            <span className="font-bold text-center">Offer Services</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input placeholder="beautyqueen" {...field} />
                      </FormControl>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingUsername ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> :
                         usernameAvailable === true ? <Check className="w-4 h-4 text-green-500" /> :
                         usernameAvailable === false ? <X className="w-4 h-4 text-destructive" /> : null}
                      </div>
                    </div>
                    {usernameAvailable === false && <FormDescription className="text-destructive">Username already taken</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about your style..." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address {form.watch("role") === "provider" ? "(Publicly Visible)" : "(For finding nearby providers)"}</FormLabel>
                    <FormControl>
                      <Input placeholder={form.watch("role") === "provider" ? "e.g. Surry Hills, Sydney" : "e.g. Sydney, NSW"} {...field} />
                    </FormControl>
                    <FormDescription>
                      {form.watch("role") === "provider" 
                        ? "Broad area is fine for safety. Australia based service only." 
                        : "We'll use this to show you nearby providers. Australia only."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {form.watch("role") === "provider" && (
                <>
                  <FormField
                    control={form.control}
                    name="locationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Where do you work?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="house">My House</SelectItem>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="studio">Studio / Salon Suite</SelectItem>
                            <SelectItem value="rented_space">Rented Space</SelectItem>
                            <SelectItem value="mobile">Mobile (I travel to clients)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Hidden fields for lat/lng - for now defaulting to Sydney */}
                  <input type="hidden" {...form.register("latitude", { value: -33.8688 })} />
                  <input type="hidden" {...form.register("longitude", { value: 151.2093 })} />
                </>
              )}

              {form.watch("role") === "client" && (
                <>
                  {/* Hidden fields for lat/lng - for now defaulting to Sydney */}
                  <input type="hidden" {...form.register("latitude", { value: -33.8688 })} />
                  <input type="hidden" {...form.register("longitude", { value: 151.2093 })} />
                </>
              )}

              <Button type="submit" className="w-full font-bold h-12 text-lg shadow-lg shadow-primary/20" disabled={createProfile.isPending}>
                {createProfile.isPending ? "Creating Profile..." : "Start Glamap"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
