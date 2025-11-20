"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from "react";
import { MagnusSDK } from "../index.js";
const MagnusContext = createContext(null);
export function MagnusProvider({ children, options }) {
    const sdk = useMemo(() => new MagnusSDK(options ?? {}), [options?.baseURL, options?.apiKey]);
    return _jsx(MagnusContext.Provider, { value: { sdk }, children: children });
}
export function useMagnusSDK() {
    const ctx = useContext(MagnusContext);
    if (!ctx)
        throw new Error("useMagnusSDK must be used within MagnusProvider");
    return ctx.sdk;
}
