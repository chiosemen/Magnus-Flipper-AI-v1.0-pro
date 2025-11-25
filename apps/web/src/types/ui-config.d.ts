declare module '@magnus-flipper-ai/ui-config' {
  export const CATEGORIES: Array<{ id: string; label: string }>;
  export function getManufacturersForCategory(category: string): Array<{ id: string; label: string }>;
  export function getModelsForManufacturer(
    manufacturer: string
  ): Array<{ series: string; models: string[]; id?: string; label?: string }>;
}
