import { SafeAreaView, ScrollView, View, Text, TextInput, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { EmptyState } from "@/components/EmptyState";

export default function EditSavedSearch() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getSavedSearch, updateSavedSearch, refresh } = useSavedSearches();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    category: "",
    manufacturer: "",
    minPrice: "",
    maxPrice: "",
    condition: "",
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await getSavedSearch(id);
        setForm({
          name: res.name || "",
          category: res.category || "",
          manufacturer: res.manufacturer || "",
          minPrice: res.minPrice ? String(res.minPrice) : "",
          maxPrice: res.maxPrice ? String(res.maxPrice) : "",
          condition: res.condition || "",
        });
      } catch (err: any) {
        setError(err?.message || "Failed to load search");
      } finally {
        setLoading(false);
      }
    })();
  }, [getSavedSearch, id]);

  const handleSave = async () => {
    if (!id) return;
    try {
      setLoading(true);
      await updateSavedSearch(id, {
        name: form.name,
        category: form.category,
        manufacturer: form.manufacturer,
        minPrice: form.minPrice ? Number(form.minPrice) : undefined,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
        condition: form.condition || undefined,
      });
      await refresh();
      router.replace(`/searches/${id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <EmptyState title="Error" description={error} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text className="text-2xl font-semibold text-white">Edit Search</Text>

        {["name", "category", "manufacturer", "minPrice", "maxPrice", "condition"].map((field) => (
          <View key={field} className="space-y-1">
            <Text className="text-sm text-slate-200 capitalize">{field}</Text>
            <TextInput
              value={form[field]}
              onChangeText={(v) => setForm((prev: any) => ({ ...prev, [field]: v }))}
              placeholder={field}
              placeholderTextColor="#94a3b8"
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-white"
            />
          </View>
        ))}

        <Pressable
          onPress={handleSave}
          disabled={loading}
          className="mt-4 rounded-full bg-cyan-500 px-4 py-3"
        >
          <Text className="text-center font-semibold text-slate-900">{loading ? "Saving..." : "Save Changes"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
