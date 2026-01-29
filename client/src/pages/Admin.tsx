import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMyProfile } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@/hooks/use-upload";
import { queryClient } from "@/lib/queryClient";
import { Users, UserCheck, MessageSquare, MapPin, Trash2, ShieldCheck, Loader2, Eye, Plus, Edit, Camera, X } from "lucide-react";
import { Redirect } from "wouter";
import { useState, useRef } from "react";
import type { Profile, Service } from "@shared/schema";

interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalClients: number;
  messagesSent: number;
  providersByLocationType: { locationType: string; count: number }[];
}

const locationTypeLabels: Record<string, string> = {
  studio: "Studio",
  house: "House",
  apartment: "Apartment",
  rented_space: "Rented Space",
  mobile: "Mobile",
};

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    city_district?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

interface ServiceFormState {
  id?: number;
  tempId?: string;
  name: string;
  description: string;
  price: string;
  duration: string;
}

export default function Admin() {
  const { isAuthenticated, isLoading: authLoading, getToken } = useAuth();
  const { data: myProfile, isLoading: profileLoading } = useMyProfile();
  const { toast } = useToast();
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    role: "provider" as "provider" | "client",
    bio: "",
    location: "",
    locationType: "" as "" | "house" | "apartment" | "studio" | "rented_space" | "mobile",
    latitude: -33.8688,
    longitude: 151.2093,
    profileImageUrl: null as string | null,
  });

  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [services, setServices] = useState<ServiceFormState[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceSavingId, setServiceSavingId] = useState<string | number | null>(null);
  const [serviceDeletingId, setServiceDeletingId] = useState<string | number | null>(null);
  
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      setFormData({ ...formData, profileImageUrl: response.objectPath });
      toast({ title: "Photo uploaded" });
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch("/api/admin/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
    enabled: isAuthenticated && myProfile?.isAdmin,
  });

  const { data: allProfiles, isLoading: profilesLoading } = useQuery<Profile[]>({
    queryKey: ["/api/admin/profiles"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch("/api/admin/profiles", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch admin profiles");
      return res.json();
    },
    enabled: isAuthenticated && myProfile?.isAdmin,
  });

  const { data: pageVisits } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/page-visits"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch("/api/admin/page-visits", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch page visits");
      return res.json();
    },
    enabled: isAuthenticated && myProfile?.isAdmin,
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken();
      const res = await fetch(`/api/admin/profiles/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete profile");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Account deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = await getToken();
      const res = await fetch(`/api/admin/profiles`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Demo account created successfully" });
      setIsCreateDialogOpen(false);
      setFormData({
        username: "",
        role: "provider",
        bio: "",
        location: "",
        locationType: "",
        latitude: -33.8688,
        longitude: 151.2093,
        profileImageUrl: null,
      });
      setLocationSearch("");
      setLocationSelected(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const token = await getToken();
      const res = await fetch(`/api/admin/profiles/${id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Account updated successfully" });
      setIsEditDialogOpen(false);
      setEditingProfile(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setLocationResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&countrycodes=au&limit=5`,
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await response.json();
      
      // Deduplicate results based on formatted location
      const seen = new Set<string>();
      const uniqueResults = data.filter((result: LocationResult) => {
        const formatted = formatLocation(result);
        if (seen.has(formatted)) return false;
        seen.add(formatted);
        return true;
      });
      
      setLocationResults(uniqueResults);
      setShowResults(true);
    } catch (error) {
      console.error("Location search error:", error);
      setLocationResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSearchChange = (value: string) => {
    setLocationSearch(value);
    setFormData({ ...formData, location: value });
    setLocationSelected(false);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchLocation(value), 500);
  };

  const selectLocation = (result: LocationResult) => {
    const formatted = formatLocation(result);
    setFormData({ ...formData, location: formatted, latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) });
    setLocationSearch(formatted);
    setLocationSelected(true);
    setShowResults(false);
    setLocationResults([]);
  };

  const formatLocation = (result: LocationResult) => {
    const address = result.address;
    if (!address) return result.display_name;
    const suburb = address.suburb || address.town || address.village || address.city || "";
    const state = address.state || "";
    const postcode = address.postcode || "";
    const parts = [suburb, state, postcode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : result.display_name;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum 5MB", variant: "destructive" });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid file", description: "Please select an image", variant: "destructive" });
        return;
      }
      await uploadFile(file);
    }
  };

  const mapServiceToForm = (service: Service): ServiceFormState => ({
    id: service.id,
    name: service.name || "",
    description: service.description || "",
    price: service.price || "",
    duration: service.duration ? String(service.duration) : "",
  });

  const loadServices = async (profileId: number) => {
    setServicesLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/profiles/${profileId}/services`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load services");
      const data: Service[] = await res.json();
      setServices(data.map(mapServiceToForm));
    } catch (error: any) {
      setServices([]);
      toast({ title: "Error", description: error.message || "Failed to load services", variant: "destructive" });
    } finally {
      setServicesLoading(false);
    }
  };

  const addServiceRow = () => {
    setServices((prev) => [
      ...prev,
      {
        tempId: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: "",
        description: "",
        price: "",
        duration: "",
      },
    ]);
  };

  const updateServiceField = (key: number | string, field: keyof ServiceFormState, value: string) => {
    setServices((prev) =>
      prev.map((service) =>
        (service.id === key || service.tempId === key) ? { ...service, [field]: value } : service
      )
    );
  };

  const saveService = async (service: ServiceFormState) => {
    if (!editingProfile) return;
    if (!service.name.trim()) {
      toast({ title: "Service name required", variant: "destructive" });
      return;
    }
    const saveKey = service.id ?? service.tempId ?? "new";
    setServiceSavingId(saveKey);
    try {
      const token = await getToken();
      const payload = {
        name: service.name.trim(),
        description: service.description.trim(),
        price: service.price.trim(),
        duration: service.duration.trim(),
      };
      const res = await fetch(
        service.id ? `/api/admin/services/${service.id}` : `/api/admin/profiles/${editingProfile.id}/services`,
        {
          method: service.id ? "PUT" : "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to save service");
      }
      const saved: Service = await res.json();
      setServices((prev) => {
        const next = prev.map((item) =>
          item.id === service.id || item.tempId === service.tempId ? mapServiceToForm(saved) : item
        );
        if (!service.id && !next.some((item) => item.id === saved.id)) {
          return [...next, mapServiceToForm(saved)];
        }
        return next;
      });
      toast({ title: "Service saved" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save service", variant: "destructive" });
    } finally {
      setServiceSavingId(null);
    }
  };

  const deleteService = async (service: ServiceFormState) => {
    const deleteKey = service.id ?? service.tempId ?? "new";
    setServiceDeletingId(deleteKey);
    try {
      if (service.id) {
        const token = await getToken();
        const res = await fetch(`/api/admin/services/${service.id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || "Failed to delete service");
        }
      }
      setServices((prev) => prev.filter((item) => item.id !== service.id && item.tempId !== service.tempId));
      toast({ title: "Service removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete service", variant: "destructive" });
    } finally {
      setServiceDeletingId(null);
    }
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      username: profile.username,
      role: profile.role as "provider" | "client",
      bio: profile.bio || "",
      location: profile.location || "",
      locationType: (profile.locationType as any) || "",
      latitude: profile.latitude || -33.8688,
      longitude: profile.longitude || 151.2093,
      profileImageUrl: profile.profileImageUrl || null,
    });
    setLocationSearch(profile.location || "");
    setLocationSelected(Boolean(profile.latitude && profile.longitude));
    setIsEditDialogOpen(true);
    if (profile.role === "provider") {
      loadServices(profile.id);
    } else {
      setServices([]);
    }
  };


  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !myProfile?.isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users and view statistics</p>
          </div>
        </div>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stats" data-testid="tab-stats">Statistics</TabsTrigger>
            <TabsTrigger value="accounts" data-testid="tab-accounts">Manage Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-6">
            {statsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-users">{stats.totalUsers}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-providers">{stats.totalProviders}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-clients">{stats.totalClients}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Page Visitors</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-page-visits">{pageVisits?.count ?? 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-messages">{stats.messagesSent}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Providers by Location Type
                    </CardTitle>
                    <CardDescription>Breakdown of service providers by their workspace type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      {stats.providersByLocationType.map((item) => (
                        <div key={item.locationType} className="text-center p-4 rounded-lg bg-muted/50">
                          <div className="text-2xl font-bold">{item.count}</div>
                          <div className="text-sm text-muted-foreground">
                            {locationTypeLabels[item.locationType] || item.locationType}
                          </div>
                        </div>
                      ))}
                      {stats.providersByLocationType.length === 0 && (
                        <div className="col-span-full text-center text-muted-foreground py-8">
                          No providers with location types yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">All Accounts</h2>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Demo Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Demo Account</DialogTitle>
                    <DialogDescription>Add a new demo profile to showcase services</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="demo_artist"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="provider">Provider</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Professional makeup artist..."
                        rows={3}
                      />
                    </div>
                    {formData.role === "provider" && (
                      <>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Sydney CBD, NSW"
                          />
                        </div>
                        <div>
                          <Label htmlFor="locationType">Location Type</Label>
                          <Select value={formData.locationType} onValueChange={(value: any) => setFormData({ ...formData, locationType: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="house">House</SelectItem>
                              <SelectItem value="apartment">Apartment</SelectItem>
                              <SelectItem value="studio">Studio</SelectItem>
                              <SelectItem value="rented_space">Rented Space</SelectItem>
                              <SelectItem value="mobile">Mobile</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => createProfileMutation.mutate(formData)} disabled={!formData.username || createProfileMutation.isPending}>
                      {createProfileMutation.isPending ? "Creating..." : "Create Account"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {profilesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2">
                {allProfiles?.map((profile) => (
                  <Card key={profile.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.profileImageUrl || undefined} />
                          <AvatarFallback>{profile.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{profile.username}</span>
                            {profile.isAdmin && (
                              <Badge variant="secondary" className="text-xs">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {profile.role}
                            </Badge>
                            {profile.location && (
                              <span className="truncate max-w-[200px]">{profile.location}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {!profile.isAdmin && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(profile)} data-testid={`button-edit-${profile.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-${profile.id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {profile.username}'s account? This will also delete all their messages, reviews, and services. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProfileMutation.mutate(profile.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid={`confirm-delete-${profile.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
                
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Account</DialogTitle>
                      <DialogDescription>Update profile information</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Profile Picture</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {formData.profileImageUrl ? (
                              <img src={formData.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl font-bold">{formData.username[0]?.toUpperCase() || "?"}</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileSelect}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              {isUploading ? "Uploading..." : "Upload Photo"}
                            </Button>
                            {formData.profileImageUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFormData({ ...formData, profileImageUrl: null })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="edit-username">Username</Label>
                        <Input
                          id="edit-username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-bio">Bio</Label>
                        <Textarea
                          id="edit-bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={3}
                        />
                      </div>
                      {formData.role === "provider" && (
                        <>
                          <div className="relative">
                            <Label htmlFor="edit-location">Location</Label>
                            <Input
                              id="edit-location"
                              value={locationSearch}
                              onChange={(e) => handleLocationSearchChange(e.target.value)}
                              placeholder="Search for a location..."
                            />
                            {isSearching && (
                              <div className="absolute right-3 top-9">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                            {showResults && locationResults.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {locationResults.map((result, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-start gap-3"
                                    onClick={() => selectLocation(result)}
                                  >
                                    <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate">{result.display_name}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="edit-locationType">Location Type</Label>
                            <Select value={formData.locationType} onValueChange={(value: any) => setFormData({ ...formData, locationType: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="house">House</SelectItem>
                                <SelectItem value="apartment">Apartment</SelectItem>
                                <SelectItem value="studio">Studio</SelectItem>
                                <SelectItem value="rented_space">Rented Space</SelectItem>
                                <SelectItem value="mobile">Mobile</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Services</Label>
                              <Button type="button" variant="outline" size="sm" onClick={addServiceRow}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Service
                              </Button>
                            </div>
                            {servicesLoading ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading services...
                              </div>
                            ) : services.length === 0 ? (
                              <div className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
                                No services yet. Add one to showcase this demo account.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {services.map((service) => {
                                  const key = service.id ?? service.tempId ?? "service";
                                  const isSaving = serviceSavingId === key;
                                  const isDeleting = serviceDeletingId === key;
                                  return (
                                    <div key={key} className="rounded-lg border border-border p-3 space-y-2">
                                      <Input
                                        placeholder="Service name"
                                        value={service.name}
                                        onChange={(e) => updateServiceField(key, "name", e.target.value)}
                                      />
                                      <Textarea
                                        placeholder="Description"
                                        rows={2}
                                        value={service.description}
                                        onChange={(e) => updateServiceField(key, "description", e.target.value)}
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <Input
                                          placeholder="Price"
                                          value={service.price}
                                          onChange={(e) => updateServiceField(key, "price", e.target.value)}
                                        />
                                        <Input
                                          placeholder="Duration (mins)"
                                          type="number"
                                          min="0"
                                          value={service.duration}
                                          onChange={(e) => updateServiceField(key, "duration", e.target.value)}
                                        />
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => deleteService(service)} disabled={isDeleting || isSaving}>
                                          {isDeleting ? "Removing..." : "Remove"}
                                        </Button>
                                        <Button type="button" size="sm" onClick={() => saveService(service)} disabled={isSaving || isDeleting}>
                                          {isSaving ? "Saving..." : "Save"}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                      <Button onClick={() => editingProfile && updateProfileMutation.mutate({ id: editingProfile.id, data: formData })} disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? "Updating..." : "Update Account"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
