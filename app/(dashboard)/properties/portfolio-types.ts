// app/(dashboard)/properties/portfolio-types.ts

export interface PortfolioProperty {
  id: number;
  title: string;
  property_type: string;
  status: "available" | "occupied" | "under_maintenance";
  address: string;
  city: string | null;
  location: string;
  owner: number;
  owner_name: string;
  owner_email: string;
  initial_cost: string;
  current_value: string;
  currency: string;
  appreciation: string | null;
  roi: number | null; // percentage e.g. 12.50
  pct_performance: number | null;
  is_listed: boolean;
  is_group_property: boolean;
  total_slots: number | null;
  user_slots: number;
  income_count: number;
  expenses_count: number;
  thumbnail: string | null;
  added_on: string;
}

export interface PortfolioPropertyDetail extends PortfolioProperty {
  description: string | null;
  zip_code: string | null;
  area: number | null;
  num_units: number;
  net_income: string;
  slot_price: string | null;
  slot_price_current: string | null;
  virtual_tour_url: string | null;
  year_bought: number | null;
  images: { id: number; image: string; uploaded_at: string }[];
  files: {
    id: number;
    file: string;
    name: string | null;
    file_type: string;
    uploaded_at: string;
  }[];
  coordinates: { id: number; latitude: string; longitude: string }[];
  incomes: {
    id: number;
    amount: string;
    currency: string;
    description: string | null;
    date_received: string;
  }[];
  expenses: {
    id: number;
    amount: string;
    currency: string;
    description: string | null;
    date_incurred: string;
  }[];
  value_history: { id: number; value: string; recorded_at: string }[];
}

export interface PaginatedPortfolio {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: PortfolioProperty[];
}

export interface PortfolioStats {
  total: number;
  listed: number;
  group_properties: number;
  by_status: Record<string, number>;
  by_type: { type: string; count: number }[];
  ngn_portfolio: {
    total_initial_value: string;
    total_current_value: string;
    total_appreciation: string;
  };
  ngn_cashflow: {
    total_income: string;
    total_expenses: string;
    net: string;
  };
  top_owners: {
    id: number;
    name: string;
    email: string;
    count: number;
  }[];
}
