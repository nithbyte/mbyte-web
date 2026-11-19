import { apiClient } from "@/lib/api-client";

export interface MapsStatus {
  googleMapsConfigured: boolean;
  googleMapsActive: boolean;
  activeProvider: string;
  message: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId?: string;
  provider: "GOOGLE" | "OSM_FALLBACK";
}

export interface ReverseGeocodeResult {
  formattedAddress: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  provider: "GOOGLE" | "OSM_FALLBACK";
}

export const mapsService = {
  async getStatus(): Promise<MapsStatus> {
    return apiClient.get<MapsStatus>("/maps/status");
  },

  async geocode(address: string): Promise<GeocodeResult | null> {
    try {
      return await apiClient.get<GeocodeResult | null>("/maps/geocode", {
        params: { address },
      });
    } catch {
      return null;
    }
  },

  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    try {
      return await apiClient.get<ReverseGeocodeResult | null>("/maps/reverse-geocode", {
        params: { latitude, longitude },
      });
    } catch {
      return null;
    }
  },
};
