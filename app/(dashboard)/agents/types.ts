// app/(dashboard)/agents/types.ts

export interface AgentUser {
  id: number;
  name: string;
  first_name: string | null;
  email: string;
  is_active: boolean;
  is_email_verified: boolean;
  date_joined: string;
}

export interface AgentAdmin {
  id: number;
  name: string;
  email: string;
  role: string | null;
  access_level: number | null;
}

export interface AgentVerification {
  id: number;
  id_card: string | null;
  photo: string | null;
  business_registration: string | null;
  submitted_at: string;
  reviewed: boolean;
  approved: boolean;
  rejection_reason: string | null;
}

export interface AgentRating {
  id: number;
  rating: number;
  review: string | null;
  reviewer_name: string;
  reviewer_email: string;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: number;
  user: AgentUser;
  admin: AgentAdmin | null;
  agency_name: string | null;
  agency_address: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  experience_years: number;
  preferred_contact_mode: "phone" | "whatsapp" | "email";
  verified: boolean;
  featured: boolean;
  bio: string | null;
  rating_count: number;
  average_rating: number | null;
  has_verification: boolean;
  verification: AgentVerification | null;
  ratings: AgentRating[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedAgents {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Agent[];
}

export interface AgentStats {
  total: number;
  verified: number;
  unverified: number;
  featured: number;
  pending_verification: number;
  unassigned: number;
  average_rating: number | null;
  scope: "assigned" | "platform";
}
