// app/(dashboard)/inbox/types.ts

export type ContactStatus = "open" | "in_progress" | "resolved" | "closed";
export type ContactCategory =
  | "enquiry"
  | "support"
  | "feedback"
  | "report"
  | "other";

export interface ContactMessage {
  id: number;
  ticket_number: string;
  fullname: string;
  email: string;
  phone_number: string | null;
  category: ContactCategory;
  status: ContactStatus;
  message: string;
  notes: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Feedback {
  id: number;
  user: number;
  user_name: string;
  user_email: string;
  position: string;
  company: string;
  feedback: string;
  is_approved: boolean;
  is_featured: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface PaginatedContacts {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: ContactMessage[];
}

export interface PaginatedFeedback {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Feedback[];
}

export interface InboxStats {
  contacts: {
    total: number;
    unassigned: number;
    by_status: Record<ContactStatus, number>;
    by_category: Partial<Record<ContactCategory, number>>;
  };
  feedback: {
    total: number;
    pending: number;
    approved: number;
    featured: number;
  };
}
