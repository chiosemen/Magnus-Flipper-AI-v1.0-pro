"use client";

import { useState } from "react";

export interface WizardState {
  category: string | null;
  manufacturer: string | null;
  models: string[];
  minPrice?: number;
  maxPrice?: number;
  radiusKm?: number;
  condition?: "any" | "new" | "used";
  name?: string;
}

export function useNewSearchWizard() {
  const [state, setState] = useState<WizardState>({
    category: null,
    manufacturer: null,
    models: [],
    condition: "any",
  });

  const setCategory = (category: string | null) => setState((prev) => ({ ...prev, category }));
  const setManufacturer = (manufacturer: string | null) => setState((prev) => ({ ...prev, manufacturer }));
  const toggleModel = (model: string) =>
    setState((prev) => ({
      ...prev,
      models: prev.models.includes(model)
        ? prev.models.filter((m) => m !== model)
        : [...prev.models, model],
    }));
  const setFilters = (filters: { minPrice?: number; maxPrice?: number; radiusKm?: number; condition?: "any" | "new" | "used" }) =>
    setState((prev) => ({ ...prev, ...filters }));
  const setName = (name?: string) => setState((prev) => ({ ...prev, name }));
  const reset = () =>
    setState({
      category: null,
      manufacturer: null,
      models: [],
      condition: "any",
    });

  return {
    state,
    setCategory,
    setManufacturer,
    toggleModel,
    setFilters,
    setName,
    reset,
  };
}
