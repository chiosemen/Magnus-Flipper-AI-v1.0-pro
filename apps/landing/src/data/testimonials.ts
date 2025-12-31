export interface Testimonial {
  id: string
  name: string
  role: string
  location: string
  avatar?: string
  rating: number
  quote: string
  profit: string
  profitAmount: number
  marketplace: string
  region: 'US' | 'UK' | 'global'
}

export const testimonials: Testimonial[] = [
  // ==================== US TESTIMONIALS ====================
  {
    id: 'us-1',
    name: 'Sarah Chen',
    role: 'Full-Time Reseller',
    location: 'Los Angeles, CA',
    rating: 5,
    quote: "Magnus Flipper has completely changed my flipping game. I'm finding deals 10x faster and my profits have tripled in just 2 months.",
    profit: '$8,400',
    profitAmount: 8400,
    marketplace: 'Facebook Marketplace',
    region: 'US',
  },
  {
    id: 'us-2',
    name: 'Marcus Rodriguez',
    role: 'Electronics Flipper',
    location: 'Austin, TX',
    rating: 5,
    quote: "The AI price analysis is incredible. It's like having a market expert working for me 24/7. I've made back my annual subscription in the first week.",
    profit: '$12,200',
    profitAmount: 12200,
    marketplace: 'eBay',
    region: 'US',
  },
  {
    id: 'us-3',
    name: 'Jennifer Walsh',
    role: 'Side Hustle Flipper',
    location: 'Chicago, IL',
    rating: 5,
    quote: "As a busy mom, I only have a few hours a week. Magnus alerts me to the best deals so I don't waste time scrolling. Made $3K last month part-time!",
    profit: '$3,100',
    profitAmount: 3100,
    marketplace: 'Facebook Marketplace',
    region: 'US',
  },
  {
    id: 'us-4',
    name: 'David Kim',
    role: 'Sneaker Reseller',
    location: 'New York, NY',
    rating: 5,
    quote: "The instant alerts are a game-changer for sneaker flipping. I've copped so many steals that were gone within minutes. Absolutely essential tool.",
    profit: '$15,800',
    profitAmount: 15800,
    marketplace: 'eBay',
    region: 'US',
  },
  {
    id: 'us-5',
    name: 'Amanda Foster',
    role: 'Vintage Furniture Flipper',
    location: 'Denver, CO',
    rating: 5,
    quote: "Found a Herman Miller chair for $50 that I sold for $800. Magnus paid for itself 10x over with that single find. The keyword alerts are incredibly precise.",
    profit: '$6,200',
    profitAmount: 6200,
    marketplace: 'Facebook Marketplace',
    region: 'US',
  },
  {
    id: 'us-6',
    name: 'Tyler Brooks',
    role: 'Video Game Reseller',
    location: 'Seattle, WA',
    rating: 5,
    quote: "I flip retro games and Magnus finds the underpriced lots that others miss. The multi-marketplace monitoring means I never miss a deal anywhere.",
    profit: '$4,900',
    profitAmount: 4900,
    marketplace: 'eBay',
    region: 'US',
  },

  // ==================== UK TESTIMONIALS ====================
  {
    id: 'uk-1',
    name: 'James Thompson',
    role: 'Full-Time Reseller',
    location: 'Manchester, UK',
    rating: 5,
    quote: "Magnus Flipper has been brilliant for my reselling business. The Gumtree integration alone has doubled my monthly finds. Absolutely chuffed with the results!",
    profit: '£6,800',
    profitAmount: 6800,
    marketplace: 'Gumtree',
    region: 'UK',
  },
  {
    id: 'uk-2',
    name: 'Sophie Williams',
    role: 'Fashion Reseller',
    location: 'London, UK',
    rating: 5,
    quote: "Vinted is massive here and Magnus helps me find designer pieces before anyone else. Sold a Burberry coat I bought for £40 for £280. Mental!",
    profit: '£5,200',
    profitAmount: 5200,
    marketplace: 'Vinted',
    region: 'UK',
  },
  {
    id: 'uk-3',
    name: 'Oliver Hughes',
    role: 'Electronics Flipper',
    location: 'Birmingham, UK',
    rating: 5,
    quote: "The CEX price reference is genius. I know exactly what trade-in value I'll get before I even buy. Found a PS5 bundle for £200, CEX gave me £380. Easy money.",
    profit: '£9,400',
    profitAmount: 9400,
    marketplace: 'Facebook Marketplace',
    region: 'UK',
  },
  {
    id: 'uk-4',
    name: 'Emma Richardson',
    role: 'Side Hustle Reseller',
    location: 'Leeds, UK',
    rating: 5,
    quote: "Between the kids and work, I've got no time to scroll through listings. Magnus sends me only the profitable ones. Making £800-1000 extra a month now.",
    profit: '£4,100',
    profitAmount: 4100,
    marketplace: 'Vinted',
    region: 'UK',
  },
  {
    id: 'uk-5',
    name: "Ryan O'Connor",
    role: 'Vintage Collector',
    location: 'Dublin, Ireland',
    rating: 5,
    quote: "Found a rare vinyl collection on Gumtree for £60, worth over £500. Magnus spotted it instantly. The AI really understands value in niche markets.",
    profit: '£7,300',
    profitAmount: 7300,
    marketplace: 'Gumtree',
    region: 'UK',
  },
  {
    id: 'uk-6',
    name: 'Charlotte Davies',
    role: 'Furniture Flipper',
    location: 'Bristol, UK',
    rating: 5,
    quote: "Mid-century furniture flies on eBay UK. Magnus alerts me to underpriced pieces on Facebook and Gumtree. Tripled my profits since subscribing.",
    profit: '£8,900',
    profitAmount: 8900,
    marketplace: 'eBay',
    region: 'UK',
  },
]

// Helper functions
export const getUSTestimonials = () => testimonials.filter(t => t.region === 'US')
export const getUKTestimonials = () => testimonials.filter(t => t.region === 'UK')
export const getTestimonialsByRegion = (region: 'US' | 'UK') =>
  testimonials.filter(t => t.region === region)
