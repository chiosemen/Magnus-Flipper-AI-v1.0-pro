import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef } from "react";

export default function RootLayout() {
  const queryClient = useRef(new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, retry: false } } }));

  return (
    <QueryClientProvider client={queryClient.current}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0f172a" },
        }}
      />
    </QueryClientProvider>
  );
}
