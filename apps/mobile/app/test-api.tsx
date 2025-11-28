import { useQuery } from "@tanstack/react-query";
import { getApiClient } from "../src/lib/api";
import { View, Text } from "react-native";

export default function TestApiScreen() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["test-health"],
    queryFn: async () => {
      const api = getApiClient();
      return api.health.check();
    },
  });

  if (isLoading) return <Text>Loading…</Text>;
  if (error) return <Text>Error: {String(error)}</Text>;

  return (
    <View style={{ padding: 20 }}>
      <Text>API Connected!</Text>
      <Text>{JSON.stringify(data, null, 2)}</Text>
    </View>
  );
}
