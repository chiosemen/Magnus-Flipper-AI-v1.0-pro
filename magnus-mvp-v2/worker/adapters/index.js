import { ebayAdapter } from "./ebayAdapter.js";
import { vintedAdapter } from "./vintedAdapter.js";
import { gumtreeAdapter } from "./gumtreeAdapter.js";

export const marketplaces = [
  { name: "ebay", adapter: ebayAdapter },
  { name: "vinted", adapter: vintedAdapter },
  { name: "gumtree", adapter: gumtreeAdapter }
];
