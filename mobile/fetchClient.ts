import * as SecureStore from 'expo-secure-store';
import { createFetchClient } from '@magnus-flipper-ai/api-client';
import { env } from './lib/env';

export const fetchClient = createFetchClient({
  baseUrl: env.apiUrl,
  getToken: () => SecureStore.getItemAsync('authToken'),
});
