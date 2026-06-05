// app/(dashboard)/trends/types.ts

export interface Category {
  id: number;
  name: string;
  report_count: number;
}

export interface Trend {
  id: number;
  title: string;
  slug: string;
  body: string;
  source: string;
  url: string | null;
  category: number;
  category_name: string;
  publish: boolean;
  views: number;
  cover_image: string | null;
  attachment: string | null;
  date_created: string;
  date_updated: string;
  excerpt?: string;
}

export interface PaginatedTrends {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Trend[];
}

export interface TrendStats {
  total: number;
  published: number;
  drafts: number;
  total_views: number;
  by_category: { id: number; name: string; count: number }[];
}
