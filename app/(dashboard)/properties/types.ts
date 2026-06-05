// app/(dashboard)/properties/types.ts

export type PropertyStatus = "draft" | "pending" | "published" | "rejected";
export type ListingPurpose = "sale" | "lease" | "rent";
export type PropertyType =
  | "house"
  | "apartment"
  | "land"
  | "commercial"
  | "office"
  | "warehouse"
  | "shop"
  | "duplex"
  | "bungalow"
  | "terrace"
  | "semi_detached"
  | "detached"
  | "farm_land"
  | "industrial"
  | "short_let"
  | "studio";

export interface PropertyOwner {
  id: number;
  name: string;
  email: string;
  is_agent: boolean;
  is_active: boolean;
}

export interface PropertyImage {
  id: number;
  image: string | null;
  image_url: string | null;
  uploaded_at: string;
}

export interface PropertyFile {
  id: number;
  file: string | null;
  name: string | null;
  image_url: string | null;
  file_type: string;
  uploaded_at: string;
}

export interface PropertyFeature {
  id: number;
  negotiable: "yes" | "slightly" | "no";
  furnished: boolean;
  pet_friendly: boolean;
  parking_available: boolean;
  swimming_pool: boolean;
  garden: boolean;
  electricity_proximity: string;
  road_network: string;
  development_level: string;
  water_supply: boolean;
  security: boolean;
  additional_features: string | null;
  verified_user: boolean;
}

export interface PropertyCoordinate {
  id: number;
  latitude: string;
  longitude: string;
}

export interface MarketProperty {
  id: number;
  title: string;
  slug: string;
  description: string;
  property_type: PropertyType;
  listing_purpose: ListingPurpose;
  category: "corporate" | "p2p";
  status: PropertyStatus;
  price: string;
  currency: string;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  availability: "now" | "date";
  availability_date: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  square_feet: number | null;
  lot_size: string | null;
  year_built: number | null;
  views: number;
  inquiries: number;
  bookmarked: number;
  coordinate_url: string | null;
  youtube_url: string | null;
  listed_date: string;
  updated_date: string;
  owner: PropertyOwner;
  images: PropertyImage[];
  files: PropertyFile[];
  features: PropertyFeature[];
  coordinates: PropertyCoordinate[];
  image_count?: number;
}

export interface PaginatedProperties {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: MarketProperty[];
}

export interface PropertyStats {
  total: number;
  by_status: Record<PropertyStatus, number>;
  by_property_type: Record<string, number>;
  by_purpose: Record<ListingPurpose, number>;
  total_views: number;
  total_inquiries: number;
  total_bookmarks: number;
  scope: "assigned_agents" | "platform";
}
