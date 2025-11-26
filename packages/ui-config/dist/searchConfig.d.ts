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
export declare const CATEGORIES: Category[];
export declare const MANUFACTURERS_BY_CATEGORY: Record<string, Manufacturer[]>;
export declare const MODELS_BY_MANUFACTURER: Record<string, ModelSeries[]>;
/**
 * Get manufacturers for a given category
 */
export declare function getManufacturersForCategory(categoryId: string): Manufacturer[];
/**
 * Get model series for a given manufacturer
 */
export declare function getModelsForManufacturer(manufacturerId: string): ModelSeries[];
/**
 * Get all models flattened for a manufacturer
 */
export declare function getAllModelsForManufacturer(manufacturerId: string): string[];
