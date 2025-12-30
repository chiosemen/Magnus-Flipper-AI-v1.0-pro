import React, { createContext, useContext, useState, ReactNode } from 'react';

type Marketplace = 'facebook' | 'vinted' | 'gumtree';

type Listing = {
  source: Marketplace;
  title: string;
  priceText: string;
  url: string;
  image?: string;
  badge: 'verified' | 'live-capture' | 'recent' | 'in-progress';
  freshnessSeconds: number;
};

type SearchMeta = {
  marketplace: string;
  country: string;
  cached: boolean;
  cacheStatus: string;
  strategy?: string;
  ageSeconds?: number;
  ttlSeconds?: number;
  ms?: number;
  note?: string;
};

type MarketAgentEntitlement = {
  enabled: boolean;
  status: 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'comped';
  graceUntil?: string | null;
};

type AppState = {
  demoMode: boolean;
  lastQuery: string | null;
  lastMarketplace: Marketplace | null;
  lastCountry: string | null;
  entitlement: MarketAgentEntitlement | null;
  usage: {
    runs: number;
    itemsReturned: number;
    runsPerDay: number;
    itemsPerDay: number;
  } | null;
};

type AppContextType = {
  state: AppState;
  setDemoMode: (enabled: boolean) => void;
  setLastQuery: (query: string | null) => void;
  setLastMarketplace: (marketplace: Marketplace | null) => void;
  setLastCountry: (country: string | null) => void;
  setEntitlement: (entitlement: MarketAgentEntitlement | null) => void;
  setUsage: (usage: AppState['usage']) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    demoMode: true, // Default to demo mode
    lastQuery: null,
    lastMarketplace: null,
    lastCountry: null,
    entitlement: null,
    usage: null,
  });

  const setDemoMode = (enabled: boolean) => {
    setState((prev) => ({ ...prev, demoMode: enabled }));
  };

  const setLastQuery = (query: string | null) => {
    setState((prev) => ({ ...prev, lastQuery: query }));
  };

  const setLastMarketplace = (marketplace: Marketplace | null) => {
    setState((prev) => ({ ...prev, lastMarketplace: marketplace }));
  };

  const setLastCountry = (country: string | null) => {
    setState((prev) => ({ ...prev, lastCountry: country }));
  };

  const setEntitlement = (entitlement: MarketAgentEntitlement | null) => {
    setState((prev) => ({ ...prev, entitlement }));
  };

  const setUsage = (usage: AppState['usage']) => {
    setState((prev) => ({ ...prev, usage }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        setDemoMode,
        setLastQuery,
        setLastMarketplace,
        setLastCountry,
        setEntitlement,
        setUsage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

