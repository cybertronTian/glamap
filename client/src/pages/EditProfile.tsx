import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { useMyProfile, useUpdateProfile, useUpdateUsername, useCreateService, useDeleteService } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Save, MapPin, Instagram, FileText, Briefcase, Search, Camera, User } from "lucide-react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpload } from "@/hooks/use-upload";

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

export default function EditProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const updateUsername = useUpdateUsername();
  const createService = useCreateService();
  const deleteService = useDeleteService();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocationValue] = useState("");
  const [locationType, setLocationType] = useState<"house" | "apartment" | "studio" | "rented_space" | "mobile" | "">("");
  const [instagram, setInstagram] = useState("");
  const [latitude, setLatitude] = useState<number>(-33.8688);
  const [longitude, setLongitude] = useState<number>(151.2093);

  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [newServiceOpen, setNewServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDescription, setNewServiceDescription] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("");
  
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      setProfileImageUrl(response.objectPath);
      toast({ title: "Photo uploaded", description: "Click 'Save Changes' to update your profile." });
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
  });

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setLocationValue(profile.location || "");
      setLocationSearch(profile.location || "");
      setLocationType((profile.locationType as "house" | "apartment" | "studio" | "rented_space" | "mobile" | "") || "");
      setInstagram(profile.instagram || "");
      setLatitude(profile.latitude || -33.8688);
      setLongitude(profile.longitude || 151.2093);
      setLocationSelected(Boolean(profile.latitude && profile.longitude));
      setProfileImageUrl(profile.profileImageUrl || null);
    }
  }, [profile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
        return;
      }
      await uploadFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfileImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast({ title: "Photo removed", description: "Click 'Save Changes' to update your profile." });
  };

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
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      const data = await response.json();
      setLocationResults(data);
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
    setLocationValue(value);
    setLocationSelected(false);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const selectLocation = (result: LocationResult) => {
    const formatted = formatLocation(result);
    setLocationValue(formatted);
    setLocationSearch(formatted);
    setLatitude(parseFloat(result.lat));
    setLongitude(parseFloat(result.lon));
    setLocationSelected(true);
    setShowResults(false);
    setLocationResults([]);
  };

  const formatLocation = (result: LocationResult) => {
    const address = result.address;
    if (!address) return result.display_name;

    const suburb = address.suburb || address.city_district || address.town || address.village || address.city || "";
    const city = address.city || address.town || address.municipality || address.county || "";
    const state = address.state || "";
    const postcode = address.postcode || "";

    const parts = [suburb, city, state, postcode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : result.display_name;
  };

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
        <Button onClick={() => setLocation("/onboarding")}>Complete Onboarding</Button>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    if (locationType !== "mobile" && location && !locationSelected) {
      toast({
        title: "Select a suggested location",
        description: "Choose a location from the dropdown so the map pin is accurate.",
        variant: "destructive",
      });
      return;
    }
    updateProfile.mutate(
      { bio, location: location, locationType: locationType || null, instagram, latitude, longitude, profileImageUrl },
      {
        onSuccess: () => {
          toast({ title: "Profile updated", description: "Your changes have been saved." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        }
      }
    );
  };

  const handleUpdateUsername = async () => {
    if (username === profile.username) return;
    
    updateUsername.mutate(
      { username },
      {
        onSuccess: () => {
          toast({ title: "Username updated", description: "Your username has been changed." });
        },
        onError: (error: any) => {
          toast({ title: "Error", description: error.message || "Username may already be taken.", variant: "destructive" });
        }
      }
    );
  };

  const handleAddService = async () => {
    if (!newServiceName) {
      toast({ title: "Error", description: "Please enter a service name.", variant: "destructive" });
      return;
    }

    // Check if service with same name already exists
    const existingService = (profile as any)?.services?.find(
      (service: any) => service.name.toLowerCase() === newServiceName.toLowerCase()
    );
    if (existingService) {
      toast({ title: "Error", description: "A service with this name already exists.", variant: "destructive" });
      return;
    }

    createService.mutate(
      {
        name: newServiceName,
        description: newServiceDescription || undefined,
        price: newServicePrice || undefined,
        duration: newServiceDuration ? parseInt(newServiceDuration) : undefined
      },
      {
        onSuccess: () => {
          toast({ title: "Service added", description: "Your new service has been added." });
          setNewServiceOpen(false);
          setNewServiceName("");
          setNewServiceDescription("");
          setNewServicePrice("");
          setNewServiceDuration("");
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to add service.", variant: "destructive" });
        }
      }
    );
  };

  const handleDeleteService = async (serviceId: number) => {
    deleteService.mutate(serviceId, {
      onSuccess: () => {
        toast({ title: "Service deleted", description: "The service has been removed." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete service.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 max-w-2xl">
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Edit Profile</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Profile Picture
              </CardTitle>
              <CardDescription>
                {profile?.role === 'provider' 
                  ? 'Upload a photo to help clients recognize you' 
                  : 'Upload a photo to personalize your profile'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="relative">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-border">
                    {profileImageUrl ? (
                      <AvatarImage src={profileImageUrl} alt="Profile" />
                    ) : null}
                    <AvatarFallback className="text-2xl bg-primary/10 font-bold text-primary">
                      {profile?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-profile-image"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      data-testid="button-upload-photo"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {profileImageUrl ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {profileImageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleRemovePhoto}
                        disabled={isUploading}
                        className="text-destructive hover:text-destructive"
                        data-testid="button-remove-photo"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max file size: 5MB. Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    data-testid="input-username"
                  />
                  <Button
                    onClick={handleUpdateUsername}
                    disabled={username === profile.username || updateUsername.isPending}
                    data-testid="button-save-username"
                  >
                    {updateUsername.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                  </Button>
                </div>
              </div>

              {profile?.role === 'provider' && (
                <>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell clients about yourself..."
                      className="mt-1"
                      rows={4}
                      data-testid="input-bio"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instagram">Instagram Handle</Label>
                    <div className="relative mt-1">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="instagram"
                        value={instagram}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
                          value = value.replace(/^@/, '');
                          value = value.split('/')[0];
                          setInstagram(value);
                        }}
                        placeholder="yourusername"
                        className="pl-10"
                        data-testid="input-instagram"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Enter your handle without @ (e.g. yourusername)</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {profile?.role === 'provider' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
                <CardDescription>Where do you provide your services?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Label htmlFor="location-search">Enter Address</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location-search"
                      value={locationSearch}
                      onChange={(e) => handleLocationSearchChange(e.target.value)}
                      onFocus={() => locationResults.length > 0 && setShowResults(true)}
                      onBlur={() => setTimeout(() => setShowResults(false), 150)}
                      placeholder="Search for your suburb in Australia..."
                      className="pl-10"
                      data-testid="input-location-search"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  
                  {showResults && locationResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {locationResults.map((result, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectLocation(result)}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-b-0"
                          data-testid={`location-result-${index}`}
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                            <span className="line-clamp-2">{formatLocation(result)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {location && (
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Selected location:</p>
                    <p className="text-sm font-medium">{location}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="locationType">Location Type</Label>
                  <Select value={locationType} onValueChange={(val: any) => setLocationType(val)}>
                    <SelectTrigger className="mt-1" data-testid="select-location-type">
                      <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="house">Home-based</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="rented_space">Rented Space</SelectItem>
                    <SelectItem value="mobile">Mobile (I travel to clients)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-muted-foreground">
                Type your suburb or location. You can select from suggestions for exact coordinates, or just type your area name.
              </p>
            </CardContent>
          </Card>
          )}

          {profile.role === "provider" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Services
                </CardTitle>
                <CardDescription>Manage the services you offer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(profile as any).services && (profile as any).services.length > 0 ? (
                  <div className="space-y-3">
                    {(profile as any).services.map((service: any) => (
                      <div key={service.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {service.price ? `$${service.price}` : 'Price TBD'} • {service.duration ? `${service.duration} mins` : 'Duration TBD'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteService(service.id)}
                          disabled={deleteService.isPending}
                          data-testid={`button-delete-service-${service.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No services added yet</p>
                )}

                <Dialog open={newServiceOpen} onOpenChange={setNewServiceOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" data-testid="button-add-service">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Service</DialogTitle>
                      <DialogDescription>Add a new service to your profile that clients can book.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="service-name">Service Name</Label>
                        <Input
                          id="service-name"
                          value={newServiceName}
                          onChange={(e) => setNewServiceName(e.target.value)}
                          placeholder="e.g., Classic Lashes"
                          className="mt-1"
                          data-testid="input-service-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="service-description">Description</Label>
                        <Textarea
                          id="service-description"
                          value={newServiceDescription}
                          onChange={(e) => setNewServiceDescription(e.target.value)}
                          placeholder="Describe your service..."
                          className="mt-1"
                          data-testid="input-service-description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="service-price">Price ($) <span className="text-muted-foreground">(Optional)</span></Label>
                          <Input
                            id="service-price"
                            type="number"
                            value={newServicePrice}
                            onChange={(e) => setNewServicePrice(e.target.value)}
                            placeholder="80"
                            className="mt-1"
                            data-testid="input-service-price"
                          />
                        </div>
                        <div>
                          <Label htmlFor="service-duration">Duration (mins) <span className="text-muted-foreground">(Optional)</span></Label>
                          <Input
                            id="service-duration"
                            type="number"
                            value={newServiceDuration}
                            onChange={(e) => setNewServiceDuration(e.target.value)}
                            placeholder="60"
                            className="mt-1"
                            data-testid="input-service-duration"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewServiceOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddService} disabled={createService.isPending} data-testid="button-confirm-add-service">
                        {createService.isPending ? "Adding..." : "Add Service"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSaveProfile}
            disabled={updateProfile.isPending}
            className="w-full"
            size="lg"
            data-testid="button-save-profile"
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
