import { z } from 'zod';
import * as axios from 'axios';

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
