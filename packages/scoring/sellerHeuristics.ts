export type SellerClassificationInput = {
  sellerName?: string | null;
  descriptionText?: string | null;
  phoneNumber?: string | null;
  listingCountBySeller?: number | null;
  profileType?: string | null;
};

export type SellerType = "dealer" | "private" | "unknown";

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function containsAny(haystack: string, needles: string[]): boolean {
  if (!haystack) return false;
  return needles.some((needle) => haystack.includes(needle));
}

function looksLikePersonalName(rawName: string): boolean {
  const name = rawName.trim();
  if (name.length < 2 || name.length > 40) return false;

  // Reject anything that looks like a business identifier.
  if (/[0-9]/.test(name)) return false;
  if (/[&@]/.test(name)) return false;

  const normalized = name.toLowerCase();
  const dealerLike = [
    "motors",
    "motor",
    "autos",
    "auto",
    "garage",
    "ltd",
    "limited",
    "cars",
    "car sales",
    "sales",
    "trade",
    "trading",
    "group",
  ];
  if (containsAny(normalized, dealerLike)) return false;

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 3) return false;

  return words.every((w) => /^[a-z][a-z'\-]{1,15}$/.test(w));
}

export function classifySeller(input: SellerClassificationInput): SellerType {
  const sellerName = normalizeText(input.sellerName);
  const description = normalizeText(input.descriptionText);
  const profileType = normalizeText(input.profileType);
  const listingCount =
    typeof input.listingCountBySeller === "number" &&
    Number.isFinite(input.listingCountBySeller)
      ? input.listingCountBySeller
      : null;

  const dealerNameSignals = [
    "motors",
    "motor",
    "autos",
    "auto",
    "garage",
    "ltd",
    "limited",
    "cars",
    "car sales",
    "sales",
    "trade",
    "trading",
  ];

  const dealerDescriptionSignals = [
    "finance available",
    "warranty",
    "px welcome",
    "part exchange",
    "trade sale",
    "dealer",
    "open 7 days",
    "viewing by appointment",
    "vat",
  ];

  const privateDescriptionSignals = [
    "my car",
    "owned for",
    "owned since",
    "selling as i upgraded",
    "selling as i have upgraded",
    "selling as upgraded",
    "selling because",
    "selling due to",
    "private sale",
    "genuine reason",
    "family car",
  ];

  const dealerByProfileType =
    profileType.includes("dealer") ||
    profileType.includes("business") ||
    profileType.includes("trader") ||
    profileType.includes("garage");

  const dealerByName = containsAny(sellerName, dealerNameSignals);
  const dealerByDescription = containsAny(description, dealerDescriptionSignals);
  const dealerByListingCount = typeof listingCount === "number" && listingCount >= 4;

  if (dealerByProfileType || dealerByName || dealerByDescription || dealerByListingCount) {
    return "dealer";
  }

  const privateByName = sellerName.length > 0 && looksLikePersonalName(input.sellerName ?? "");
  const privateByDescription = containsAny(description, privateDescriptionSignals);

  if (privateByName && privateByDescription) return "private";
  if (privateByDescription && !dealerByName && !dealerByDescription) return "private";

  return "unknown";
}

