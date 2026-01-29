import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";

export interface AuthUser {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  imageUrl?: string | null;
}

export function useAuth() {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user, isLoaded: isUserLoaded } = useUser();

  const normalizedUser: AuthUser | null = user
    ? {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || null,
        imageUrl: user.imageUrl,
      }
    : null;

  const getAuthToken = async () => {
    if (!isSignedIn) return null;
    return getToken();
  };

  const logout = async () => {
    await signOut();
  };

  return {
    user: normalizedUser,
    isAuthenticated: Boolean(isSignedIn),
    isLoading: !isLoaded || !isUserLoaded,
    getToken: getAuthToken,
    logout,
  };
}
