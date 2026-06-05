// app/(dashboard)/learn/types.ts

export type LearnCategory = "Real Estate" | "Finance" | "Investment";

export interface LearnResource {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: LearnCategory;
  youtube_url: string;
  youtube_id: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  view_count: number;
  created_at: string;
}

export interface PaginatedLearn {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: LearnResource[];
}

export interface LearnStats {
  total: number;
  total_views: number;
  by_category: { category: string; label: string; count: number }[];
}
