import React from "react";
import { MagnusSDK, SDKClientOptions } from "../index.js";
export declare function MagnusProvider({ children, options }: {
    children: React.ReactNode;
    options?: SDKClientOptions;
}): import("react/jsx-runtime").JSX.Element;
export declare function useMagnusSDK(): MagnusSDK;
