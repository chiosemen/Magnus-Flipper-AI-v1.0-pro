export interface Deal {
  id: string;
  title: string;
  price: number;
  currency: string;
  score: number;
  url: string;
  created_at: string;
}

export interface DealsResponse {
  deals: Deal[];
}

export interface Alert {
  id: string;
  user_id: string;
  deal_id: string;
  channel: "email" | "sms" | "push";
  status: "pending" | "sent" | "failed";
  sent_at?: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  keywords: string[];
  min_price?: number;
  max_price?: number;
  created_at: string;
}

export interface WatchlistCreateInput {
  name: string;
  keywords: string[];
  min_price?: number;
  max_price?: number;
}
