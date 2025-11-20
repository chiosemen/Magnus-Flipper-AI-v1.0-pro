"use client";

import React, { createContext, useContext, useMemo } from "react";
import { MagnusSDK, SDKClientOptions } from "../index.js";

type MagnusContextType = { sdk: MagnusSDK };

const MagnusContext = createContext<MagnusContextType | null>(null);

export function MagnusProvider({
  children,
  options
}: {
  children: React.ReactNode;
  options?: SDKClientOptions;
}) {
  const sdk = useMemo(
    () => new MagnusSDK(options ?? {}),
    [options?.baseURL, options?.apiKey]
  );

  return <MagnusContext.Provider value={{ sdk }}>{children}</MagnusContext.Provider>;
}

export function useMagnusSDK() {
  const ctx = useContext(MagnusContext);
  if (!ctx) throw new Error("useMagnusSDK must be used within MagnusProvider");
  return ctx.sdk;
}
