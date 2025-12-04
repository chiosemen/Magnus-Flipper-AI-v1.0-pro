/**
 * Packaging Advisor
 * Recommends appropriate packaging based on item characteristics
 */

import type { PackagingRecommendation, PackageDimensions } from "../schemas/ShippingRequest.js";

export interface ItemCharacteristics {
  weight: number; // ounces
  dimensions?: { length: number; width: number; height: number };
  fragile: boolean;
  category?: string;
  value?: number;
}

/**
 * Recommend packaging for an item
 */
export function recommendPackaging(
  item: ItemCharacteristics
): PackagingRecommendation {
  const { weight, dimensions, fragile, category, value } = item;

  // Determine package type based on characteristics
  let packageType: PackagingRecommendation["packageType"];
  let materials: string[] = [];
  let instructions: string[] = [];
  let estimatedCost = 0;

  // Small, lightweight items
  if (weight <= 16 && !fragile) {
    if (category?.includes("clothing") || category?.includes("fabric")) {
      packageType = "poly_mailer_small";
      materials = ["10x13 poly mailer", "packing slip"];
      instructions = [
        "Fold item neatly",
        "Place in poly mailer",
        "Include packing slip",
        "Seal securely",
      ];
      estimatedCost = 0.25;
    } else {
      packageType = "padded_envelope";
      materials = ["6x10 padded envelope", "bubble wrap (optional)"];
      instructions = [
        "Wrap item if needed",
        "Place in padded envelope",
        "Seal securely",
      ];
      estimatedCost = 0.5;
    }
  }
  // Medium items or fragile
  else if (weight <= 64 || fragile) {
    packageType = fragile ? "box_medium" : "box_small";
    materials = [
      fragile ? "12x12x8 box" : "10x8x6 box",
      "bubble wrap",
      "packing paper",
      "packing tape",
    ];
    instructions = [
      "Line box with packing paper",
      "Wrap item in bubble wrap (2-3 layers)",
      "Place item in center of box",
      "Fill void space with packing paper",
      "Seal box with packing tape",
    ];

    if (fragile) {
      instructions.push('Mark box "FRAGILE" on all sides');
      materials.push("FRAGILE stickers");
    }

    estimatedCost = fragile ? 2.5 : 1.5;
  }
  // Large items
  else {
    packageType = "box_large";
    materials = [
      "18x14x12 box",
      "bubble wrap",
      "packing peanuts or paper",
      "heavy-duty packing tape",
    ];
    instructions = [
      "Use double-walled box for heavy items",
      "Wrap item thoroughly in bubble wrap",
      "Place item in center of box",
      "Fill all void space with packing peanuts",
      "Seal box with heavy-duty tape",
      "Reinforce corners and edges",
    ];
    estimatedCost = 4.0;
  }

  // High-value items get extra protection
  if (value && value > 500) {
    if (!materials.includes("bubble wrap")) {
      materials.push("bubble wrap");
    }
    materials.push("insurance declaration");
    instructions.push("Consider signature confirmation");
    estimatedCost += 1.0;
  }

  // Calculate package dimensions
  const packageDimensions = estimatePackageDimensions(
    item.dimensions,
    packageType,
    fragile
  );

  return {
    packageType,
    dimensions: packageDimensions,
    materials,
    instructions,
    fragile,
    estimatedCost,
  };
}

/**
 * Estimate final package dimensions after packing
 */
function estimatePackageDimensions(
  itemDimensions: ItemCharacteristics["dimensions"],
  packageType: string,
  fragile: boolean
): PackageDimensions {
  // Standard package dimensions by type
  const standardDimensions: Record<string, PackageDimensions> = {
    poly_mailer_small: {
      length: 13,
      width: 10,
      height: 1,
      weight: 2,
      weightUnit: "oz",
      dimensionUnit: "in",
    },
    poly_mailer_large: {
      length: 19,
      width: 14,
      height: 1,
      weight: 3,
      weightUnit: "oz",
      dimensionUnit: "in",
    },
    padded_envelope: {
      length: 10,
      width: 6,
      height: 1,
      weight: 3,
      weightUnit: "oz",
      dimensionUnit: "in",
    },
    box_small: {
      length: 10,
      width: 8,
      height: 6,
      weight: 8,
      weightUnit: "oz",
      dimensionUnit: "in",
    },
    box_medium: {
      length: 12,
      width: 12,
      height: 8,
      weight: 12,
      weightUnit: "oz",
      dimensionUnit: "in",
    },
    box_large: {
      length: 18,
      width: 14,
      height: 12,
      weight: 20,
      weightUnit: "oz",
      dimensionUnit: "in",
    },
  };

  const baseDimensions = standardDimensions[packageType];

  if (!itemDimensions || !baseDimensions) {
    return baseDimensions || standardDimensions.box_medium;
  }

  // Add padding for fragile items
  const padding = fragile ? 3 : 1;

  return {
    length: Math.max(baseDimensions.length, itemDimensions.length + padding),
    width: Math.max(baseDimensions.width, itemDimensions.width + padding),
    height: Math.max(baseDimensions.height, itemDimensions.height + padding),
    weight: baseDimensions.weight,
    weightUnit: "oz",
    dimensionUnit: "in",
  };
}

/**
 * Calculate total packing cost
 */
export function calculatePackingCost(
  recommendation: PackagingRecommendation
): number {
  return recommendation.estimatedCost || 0;
}

/**
 * Get packing checklist
 */
export function getPackingChecklist(
  recommendation: PackagingRecommendation
): string[] {
  const checklist: string[] = [];

  checklist.push("Gather materials:");
  recommendation.materials.forEach((material) => {
    checklist.push(`  ☐ ${material}`);
  });

  checklist.push("\nPacking steps:");
  recommendation.instructions.forEach((instruction, idx) => {
    checklist.push(`  ${idx + 1}. ${instruction}`);
  });

  if (recommendation.fragile) {
    checklist.push("\n⚠️  FRAGILE - Handle with care");
  }

  return checklist;
}
