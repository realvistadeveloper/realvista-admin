// lib/types.ts

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AdminProfile {
  role: "super_admin" | "moderator" | "content_manager";
  access_level: number; // 1–5; 5 = super admin
  permissions: Record<string, unknown>;
}

export type AdminRole = "super_admin" | "moderator" | "content_manager";

export interface AdminUser {
  id: number;
  name: string;
  first_name: string | null;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  staff_level: number;
  access_level: number;
  role: AdminRole | null;
  permissions: Record<string, unknown>;
  admin_profile: AdminProfile | null;
}

/** Shape returned by POST /admin-api/auth/login/ */
export interface AuthTokens {
  access: string; // short-lived JWT (30 min)
  refresh: string; // rotating JWT   (7 days)
  staff_level: number;
  user: AdminUser;
}

// ── Pagination wrapper ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  page_size?: number;
  results: T[];
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  phone_number: string | null;
  whatsapp_number: string | null;
  country_of_residence: string | null;
  state: string;
  city: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  birth_date: string | null;
  avatar: string | null;
}

export interface UserPreference {
  contact_by_email: boolean;
  contact_by_whatsapp: boolean;
  contact_by_phone: boolean;
}

export interface AppUser {
  id: number;
  name: string;
  first_name: string | null;
  email: string;
  auth_provider: string;
  is_active: boolean;
  is_staff: boolean;
  is_agent: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_identity_verified: boolean;
  referral_code: string;
  total_referral_earnings: string; // Decimal comes back as string from DRF
  referrer: string | null; // email of referrer
  referred_users_count: number;
  date_joined: string;
  profile: UserProfile | null;
  preference: UserPreference | null;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  email_verified: number;
  email_unverified: number;
  agents: number;
  staff: number;
  by_auth_provider: Record<string, number>;
}

// ── Agents ────────────────────────────────────────────────────────────────────

export interface AgentVerification {
  id: number;
  submitted_at: string;
  reviewed: boolean;
  approved: boolean;
  rejection_reason: string | null;
  id_card: string | null;
  photo: string | null;
  business_registration: string | null;
}

export interface Agent {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    is_email_verified: boolean;
  };
  admin: { id: number; email: string } | null;
  agency_name: string | null;
  agency_address: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  experience_years: number;
  preferred_contact_mode: "phone" | "whatsapp" | "email";
  verified: boolean;
  featured: boolean;
  bio: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
  rating_avg: number | null;
  rating_count: number;
  verification: AgentVerification | null;
}

export interface AgentRating {
  id: number;
  agent_id: number;
  agent_name: string;
  user_id: number;
  user_email: string;
  rating: 1 | 2 | 3 | 4 | 5;
  review: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentStats {
  total_agents: number;
  verified: number;
  unverified: number;
  featured: number;
  pending_verification_review: number;
  unassigned_to_staff: number;
}

// ── Properties ────────────────────────────────────────────────────────────────

export type PropertyStatus = "draft" | "pending" | "published" | "rejected";
export type ListingPurpose = "sale" | "lease" | "rent";
export type PropertyCategory = "corporate" | "p2p";

export interface PropertyImage {
  id: number;
  image: string | null;
  image_url: string | null;
  uploaded_at: string;
}

export interface PropertyFile {
  id: number;
  name: string | null;
  file: string | null;
  image_url: string | null;
  file_type: string;
  uploaded_at: string;
}

export interface PropertyFeatures {
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
  status: PropertyStatus;
  listing_purpose: ListingPurpose;
  category: PropertyCategory;
  property_type: string;
  price: string;
  currency: string;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  square_feet: number | null;
  lot_size: string | null;
  year_built: number | null;
  views: number;
  inquiries: number;
  bookmarked: number;
  availability: string;
  availability_date: string | null;
  listed_date: string;
  updated_date: string;
  owner: { id: number; name: string; email: string };
  // Only present in full (detail) responses:
  description?: string;
  coordinate_url?: string | null;
  images?: PropertyImage[];
  files?: PropertyFile[];
  features?: PropertyFeatures | null;
  coordinates?: PropertyCoordinate[];
}

export interface PropertyStats {
  total: number;
  total_views: number;
  total_inquiries: number;
  total_bookmarks: number;
  by_status: Record<string, number>;
  by_property_type: Record<string, number>;
  by_listing_purpose: Record<string, number>;
}
