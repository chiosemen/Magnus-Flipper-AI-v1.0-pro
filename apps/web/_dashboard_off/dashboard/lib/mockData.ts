// Mock data for Affiliate Dashboard
// Replace with actual API calls when backend is ready

export interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  clicks: number;
  conversions: number;
  revenue: number;
  status: "active" | "paused";
  createdAt: string;
}

export interface Creative {
  id: string;
  name: string;
  type: "banner" | "text" | "video";
  status: "active" | "paused" | "draft";
  clicks: number;
  conversions: number;
  ctr: number;
  previewUrl?: string;
}

export interface EarningsDataPoint {
  date: string;
  amount: number;
}

export const mockLinks: AffiliateLink[] = [
  {
    id: "1",
    name: "Homepage Referral",
    url: "https://magnusflipper.ai/?ref=abc123",
    clicks: 12450,
    conversions: 342,
    revenue: 12540.50,
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Product Page",
    url: "https://magnusflipper.ai/products?ref=def456",
    clicks: 8920,
    conversions: 198,
    revenue: 7234.20,
    status: "active",
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    name: "Blog Post",
    url: "https://magnusflipper.ai/blog/guide?ref=ghi789",
    clicks: 5430,
    conversions: 87,
    revenue: 3120.75,
    status: "paused",
    createdAt: "2024-02-01",
  },
  {
    id: "4",
    name: "Landing Page",
    url: "https://magnusflipper.ai/landing?ref=jkl012",
    clicks: 2100,
    conversions: 45,
    revenue: 1650.00,
    status: "active",
    createdAt: "2024-02-10",
  },
];

export const mockCreatives: Creative[] = [
  {
    id: "1",
    name: "Hero Banner",
    type: "banner",
    status: "active",
    clicks: 5420,
    conversions: 128,
    ctr: 2.36,
    previewUrl: "https://via.placeholder.com/300x150",
  },
  {
    id: "2",
    name: "Sidebar Ad",
    type: "banner",
    status: "active",
    clicks: 3210,
    conversions: 76,
    ctr: 2.37,
    previewUrl: "https://via.placeholder.com/300x250",
  },
  {
    id: "3",
    name: "Video Promo",
    type: "video",
    status: "active",
    clicks: 8900,
    conversions: 234,
    ctr: 2.63,
  },
  {
    id: "4",
    name: "Text Link Set",
    type: "text",
    status: "paused",
    clicks: 1200,
    conversions: 28,
    ctr: 2.33,
  },
  {
    id: "5",
    name: "Footer Banner",
    type: "banner",
    status: "draft",
    clicks: 0,
    conversions: 0,
    ctr: 0,
    previewUrl: "https://via.placeholder.com/728x90",
  },
];

export const mockEarnings7d: EarningsDataPoint[] = [
  { date: "Mon", amount: 450.25 },
  { date: "Tue", amount: 520.50 },
  { date: "Wed", amount: 380.75 },
  { date: "Thu", amount: 610.00 },
  { date: "Fri", amount: 540.25 },
  { date: "Sat", amount: 480.50 },
  { date: "Sun", amount: 510.75 },
];

export const mockEarnings30d: EarningsDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}`,
  amount: Math.floor(Math.random() * 600) + 300,
}));

export const mockMetrics = {
  totalEarnings: { label: "Total Earnings", value: "$24,550.45", change: "+12.5%", changeType: "positive" as const },
  totalClicks: { label: "Total Clicks", value: "28,900", change: "+8.2%", changeType: "positive" as const },
  conversionRate: { label: "Conversion Rate", value: "2.4%", change: "+0.3%", changeType: "positive" as const },
  activeLinks: { label: "Active Links", value: "12", change: "+2", changeType: "positive" as const },
};
