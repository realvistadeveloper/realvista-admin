// app/(dashboard)/marketing/types.ts
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost";

export interface Lead {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  company_name: string | null;
  address: string | null;
  notes: string | null;
  status: LeadStatus;
  source: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  allowed_transitions: LeadStatus[];
  last_contacted_at: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Newsletter {
  id: number;
  subject: string;
  body: string;
  recipient_type: string;
  status: "draft" | "sent" | "failed";
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_by: number | null;
  created_by_name: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface PaginatedLeads {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Lead[];
}
export interface PaginatedNewsletters {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Newsletter[];
}
export interface MarketingStats {
  leads: { total: number; by_status: Record<LeadStatus, number> };
  newsletters: {
    total: number;
    drafts: number;
    sent: number;
    total_emails_sent: number;
  };
}
