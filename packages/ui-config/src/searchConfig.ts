/**
 * Shared UI configuration for search categories, manufacturers, and models
 * Used by both web and mobile apps to ensure consistency
 */

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export interface Manufacturer {
  id: string;
  label: string;
  logo: string;
}

export interface ModelSeries {
  series: string;
  models: string[];
}

export const CATEGORIES: Category[] = [
  { id: "phones", label: "Phones & Tablets", icon: "smartphone" },
  { id: "laptops", label: "Laptops & Computers", icon: "laptop" },
  { id: "cars", label: "Cars & Trucks", icon: "car" },
  { id: "motorcycles", label: "Motorcycles", icon: "bike" },
  { id: "electronics", label: "Electronics", icon: "tv" },
  { id: "cameras", label: "Cameras & Photo", icon: "camera" },
  { id: "gaming", label: "Gaming Consoles", icon: "gamepad" },
  { id: "appliances", label: "Appliances", icon: "washing-machine" },
  { id: "furniture", label: "Furniture", icon: "sofa" },
  { id: "jewelry", label: "Jewelry & Watches", icon: "watch" },
];

export const MANUFACTURERS_BY_CATEGORY: Record<string, Manufacturer[]> = {
  phones: [
    { id: "apple", label: "Apple", logo: "apple" },
    { id: "samsung", label: "Samsung", logo: "samsung" },
    { id: "google", label: "Google Pixel", logo: "google" },
    { id: "oneplus", label: "OnePlus", logo: "oneplus" },
    { id: "motorola", label: "Motorola", logo: "motorola" },
    { id: "xiaomi", label: "Xiaomi", logo: "xiaomi" },
    { id: "lg", label: "LG", logo: "lg" },
  ],
  laptops: [
    { id: "apple", label: "Apple MacBook", logo: "apple" },
    { id: "dell", label: "Dell", logo: "dell" },
    { id: "hp", label: "HP", logo: "hp" },
    { id: "lenovo", label: "Lenovo", logo: "lenovo" },
    { id: "asus", label: "ASUS", logo: "asus" },
    { id: "microsoft", label: "Microsoft Surface", logo: "microsoft" },
    { id: "acer", label: "Acer", logo: "acer" },
    { id: "msi", label: "MSI", logo: "msi" },
  ],
  cars: [
    { id: "toyota", label: "Toyota", logo: "toyota" },
    { id: "honda", label: "Honda", logo: "honda" },
    { id: "ford", label: "Ford", logo: "ford" },
    { id: "chevrolet", label: "Chevrolet", logo: "chevrolet" },
    { id: "nissan", label: "Nissan", logo: "nissan" },
    { id: "bmw", label: "BMW", logo: "bmw" },
    { id: "mercedes", label: "Mercedes-Benz", logo: "mercedes" },
    { id: "tesla", label: "Tesla", logo: "tesla" },
    { id: "audi", label: "Audi", logo: "audi" },
    { id: "volkswagen", label: "Volkswagen", logo: "volkswagen" },
  ],
  motorcycles: [
    { id: "harley", label: "Harley-Davidson", logo: "harley" },
    { id: "yamaha", label: "Yamaha", logo: "yamaha" },
    { id: "kawasaki", label: "Kawasaki", logo: "kawasaki" },
    { id: "honda-moto", label: "Honda", logo: "honda" },
    { id: "suzuki", label: "Suzuki", logo: "suzuki" },
    { id: "ducati", label: "Ducati", logo: "ducati" },
  ],
  electronics: [
    { id: "sony", label: "Sony", logo: "sony" },
    { id: "lg", label: "LG", logo: "lg" },
    { id: "samsung", label: "Samsung", logo: "samsung" },
    { id: "bose", label: "Bose", logo: "bose" },
    { id: "jbl", label: "JBL", logo: "jbl" },
  ],
  cameras: [
    { id: "canon", label: "Canon", logo: "canon" },
    { id: "nikon", label: "Nikon", logo: "nikon" },
    { id: "sony-camera", label: "Sony", logo: "sony" },
    { id: "fujifilm", label: "Fujifilm", logo: "fujifilm" },
    { id: "panasonic", label: "Panasonic", logo: "panasonic" },
    { id: "gopro", label: "GoPro", logo: "gopro" },
  ],
  gaming: [
    { id: "sony-ps", label: "PlayStation", logo: "playstation" },
    { id: "microsoft-xbox", label: "Xbox", logo: "xbox" },
    { id: "nintendo", label: "Nintendo", logo: "nintendo" },
  ],
};

export const MODELS_BY_MANUFACTURER: Record<string, ModelSeries[]> = {
  apple: [
    {
      series: "iPhone 16 Series",
      models: ["iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max"],
    },
    {
      series: "iPhone 15 Series",
      models: ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"],
    },
    {
      series: "iPhone 14 Series",
      models: ["iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max"],
    },
    {
      series: "iPhone 13 Series",
      models: ["iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max"],
    },
    {
      series: "iPhone 12 Series",
      models: ["iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max"],
    },
    {
      series: "iPhone 11 Series",
      models: ["iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max"],
    },
    {
      series: "iPhone SE",
      models: ["iPhone SE (3rd gen)", "iPhone SE (2nd gen)"],
    },
    {
      series: "iPad Pro",
      models: ["iPad Pro 12.9-inch", "iPad Pro 11-inch"],
    },
    {
      series: "iPad Air",
      models: ["iPad Air (5th gen)", "iPad Air (4th gen)"],
    },
    {
      series: "MacBook Pro",
      models: ["MacBook Pro 16-inch", "MacBook Pro 14-inch", "MacBook Pro 13-inch"],
    },
    {
      series: "MacBook Air",
      models: ["MacBook Air M2", "MacBook Air M1"],
    },
  ],
  samsung: [
    {
      series: "Galaxy S24 Series",
      models: ["Galaxy S24", "Galaxy S24+", "Galaxy S24 Ultra"],
    },
    {
      series: "Galaxy S23 Series",
      models: ["Galaxy S23", "Galaxy S23+", "Galaxy S23 Ultra"],
    },
    {
      series: "Galaxy S22 Series",
      models: ["Galaxy S22", "Galaxy S22+", "Galaxy S22 Ultra"],
    },
    {
      series: "Galaxy Z Fold",
      models: ["Galaxy Z Fold 5", "Galaxy Z Fold 4", "Galaxy Z Fold 3"],
    },
    {
      series: "Galaxy Z Flip",
      models: ["Galaxy Z Flip 5", "Galaxy Z Flip 4", "Galaxy Z Flip 3"],
    },
    {
      series: "Galaxy A Series",
      models: ["Galaxy A54", "Galaxy A53", "Galaxy A34", "Galaxy A33"],
    },
  ],
  google: [
    {
      series: "Pixel 9 Series",
      models: ["Pixel 9", "Pixel 9 Pro", "Pixel 9 Pro XL", "Pixel 9 Pro Fold"],
    },
    {
      series: "Pixel 8 Series",
      models: ["Pixel 8", "Pixel 8 Pro"],
    },
    {
      series: "Pixel 7 Series",
      models: ["Pixel 7", "Pixel 7 Pro", "Pixel 7a"],
    },
    {
      series: "Pixel 6 Series",
      models: ["Pixel 6", "Pixel 6 Pro", "Pixel 6a"],
    },
  ],
  tesla: [
    {
      series: "Model S",
      models: ["Model S", "Model S Plaid"],
    },
    {
      series: "Model 3",
      models: ["Model 3", "Model 3 Performance"],
    },
    {
      series: "Model X",
      models: ["Model X", "Model X Plaid"],
    },
    {
      series: "Model Y",
      models: ["Model Y", "Model Y Performance"],
    },
    {
      series: "Cybertruck",
      models: ["Cybertruck"],
    },
  ],
  "sony-ps": [
    {
      series: "PlayStation 5",
      models: ["PS5", "PS5 Digital Edition", "PS5 Slim"],
    },
    {
      series: "PlayStation 4",
      models: ["PS4", "PS4 Pro", "PS4 Slim"],
    },
  ],
  "microsoft-xbox": [
    {
      series: "Xbox Series",
      models: ["Xbox Series X", "Xbox Series S"],
    },
    {
      series: "Xbox One",
      models: ["Xbox One", "Xbox One X", "Xbox One S"],
    },
  ],
  nintendo: [
    {
      series: "Switch",
      models: ["Switch OLED", "Switch", "Switch Lite"],
    },
  ],
};

/**
 * Get manufacturers for a given category
 */
export function getManufacturersForCategory(categoryId: string): Manufacturer[] {
  return MANUFACTURERS_BY_CATEGORY[categoryId] || [];
}

/**
 * Get model series for a given manufacturer
 */
export function getModelsForManufacturer(manufacturerId: string): ModelSeries[] {
  return MODELS_BY_MANUFACTURER[manufacturerId] || [];
}

/**
 * Get all models flattened for a manufacturer
 */
export function getAllModelsForManufacturer(manufacturerId: string): string[] {
  const series = MODELS_BY_MANUFACTURER[manufacturerId] || [];
  return series.flatMap((s) => s.models);
}
