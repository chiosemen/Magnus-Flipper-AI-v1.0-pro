import { z } from 'zod';
import * as axios from 'axios';
export { b as MagnusProvider, M as MagnusSDK, a as SDKClient, S as SDKClientOptions, u as useMagnusSDK } from './MagnusContext-C5cd9WM_.mjs';
import 'react/jsx-runtime';
import 'react';

declare function ping(): string;
declare function getVersion(): string;

declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
}, {
    id: string;
    email: string;
}>;
type User = z.infer<typeof UserSchema>;

declare const apiClient: axios.AxiosInstance;
declare function fetchDeals(): Promise<any>;

export { type User, UserSchema, apiClient, fetchDeals, getVersion, ping };
