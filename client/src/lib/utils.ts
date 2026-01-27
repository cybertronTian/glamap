import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenLocation(location: string | null | undefined): string {
  if (!location) return "Location Hidden";
  
  const parts = location.split(',').map(p => p.trim());
  
  if (parts.length <= 2) return location;
  
  const filtered = parts.filter(part => {
    const lower = part.toLowerCase();
    return !lower.includes('australia') && 
           !lower.includes('new south wales') &&
           !lower.includes('victoria') &&
           !lower.includes('queensland') &&
           !lower.includes('western australia') &&
           !lower.includes('south australia') &&
           !lower.includes('tasmania') &&
           !lower.includes('northern territory') &&
           !lower.includes('council') &&
           !/^\d{4}$/.test(part);
  });
  
  return filtered.slice(0, 2).join(', ') || parts[0];
}
