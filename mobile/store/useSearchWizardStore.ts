/**
 * Search Wizard Store - Zustand store for multi-step search creation
 * Manages form state across wizard steps
 */

import { create } from 'zustand';
import type { MarketplaceSite, Condition } from '@magnus-flipper-ai/core';

export interface SearchWizardState {
  // Current step (1-5)
  currentStep: number;

  // Step 1: Category & Marketplace
  category: string | null;
  sites: MarketplaceSite[];

  // Step 2: Manufacturer
  manufacturer: string | null;

  // Step 3: Models
  models: string[];

  // Step 4: Filters
  minPrice: number | undefined;
  maxPrice: number | undefined;
  radiusMiles: number | undefined;
  locationCity: string | undefined;
  conditions: Condition[];

  // Step 5: Confirmation
  searchName: string;
  active: boolean;

  // Actions
  setStep: (step: number) => void;
  setCategory: (category: string | null) => void;
  setSites: (sites: MarketplaceSite[]) => void;
  setManufacturer: (manufacturer: string | null) => void;
  setModels: (models: string[]) => void;
  toggleModel: (model: string) => void;
  setMinPrice: (price: number | undefined) => void;
  setMaxPrice: (price: number | undefined) => void;
  setRadiusMiles: (radius: number | undefined) => void;
  setLocationCity: (city: string | undefined) => void;
  setConditions: (conditions: Condition[]) => void;
  toggleCondition: (condition: Condition) => void;
  setSearchName: (name: string) => void;
  setActive: (active: boolean) => void;
  reset: () => void;
  nextStep: () => void;
  previousStep: () => void;
}

const initialState = {
  currentStep: 1,
  category: null,
  sites: [] as MarketplaceSite[],
  manufacturer: null,
  models: [] as string[],
  minPrice: undefined,
  maxPrice: undefined,
  radiusMiles: undefined,
  locationCity: undefined,
  conditions: [] as Condition[],
  searchName: '',
  active: true,
};

export const useSearchWizardStore = create<SearchWizardState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setCategory: (category) => set({ category }),

  setSites: (sites) => set({ sites }),

  setManufacturer: (manufacturer) => set({ manufacturer }),

  setModels: (models) => set({ models }),

  toggleModel: (model) =>
    set((state) => ({
      models: state.models.includes(model)
        ? state.models.filter((m) => m !== model)
        : [...state.models, model],
    })),

  setMinPrice: (minPrice) => set({ minPrice }),

  setMaxPrice: (maxPrice) => set({ maxPrice }),

  setRadiusMiles: (radiusMiles) => set({ radiusMiles }),

  setLocationCity: (locationCity) => set({ locationCity }),

  setConditions: (conditions) => set({ conditions }),

  toggleCondition: (condition) =>
    set((state) => ({
      conditions: state.conditions.includes(condition)
        ? state.conditions.filter((c) => c !== condition)
        : [...state.conditions, condition],
    })),

  setSearchName: (searchName) => set({ searchName }),

  setActive: (active) => set({ active }),

  reset: () => set(initialState),

  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),

  previousStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
}));
