export interface LeadItem {
  name: string;
  address: string;
  phone: string;
  site: string;
  category: string;
  rating: string;
}

export interface LeadRow {
  id: string;
  user_id: string | null;
  query: string;
  location: string;
  max_results: number;
  data: LeadItem[];
  scrape_date: string;
  csv_url: string | null;
  created_at?: string;
}
