export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  highlight: string;
  regions?: Array<"US" | "UK">;
}

export const testimonials: Testimonial[] = [
  {
    quote: "We're now able to get cars with insane profit margins on the private market. Most car dealerships just don't have eyes on this market like we do now. Magnus Flipper has given us a big edge.",
    name: "Abraham",
    role: "Car Dealer in Alberta, Canada",
    highlight: "Magnus Flipper has given us a big edge",
    regions: ["US"],
  },
  {
    quote: "When you're first to private sellers with cash, that's when you're going to win the deal and make more profit. Magnus Flipper makes winning the best deals so much more likely.",
    name: "Michael",
    role: "Couch Flipper in Arizona, US",
    highlight: "Winning the best deals is much more likely",
    regions: ["US"],
  },
  {
    quote: "The AI Deal Alerts are game-changing. I used to spend hours checking multiple sites manually. Now Magnus Flipper automatically scans every marketplace in real-time and I just respond to alerts. My ROI doubled.",
    name: "Sarah",
    role: "Full-Time Flipper in Texas, US",
    highlight: "My ROI doubled with AI Deal Alerts",
    regions: ["US"],
  },
  {
    quote: "I stopped refreshing Marketplace all day. The alerts are selective and the feed stays clean — I just act when something worth flipping appears.",
    name: "Hannah",
    role: "Phone reseller in Manchester, UK",
    highlight: "Selective alerts, clean feed",
    regions: ["UK"],
  },
  {
    quote: "Getting Facebook and Gumtree opportunities in one place is a game-changer. It feels like I’m early, without the spam.",
    name: "James",
    role: "Car trader in Birmingham, UK",
    highlight: "Early deals without the spam",
    regions: ["UK"],
  },
];
