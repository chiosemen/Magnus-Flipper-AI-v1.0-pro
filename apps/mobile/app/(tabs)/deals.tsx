// mobile/app/(tabs)/deals.tsx
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/magnusClient';

export default function DealsScreen() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Deals</Text>

      <View style={styles.section}>
        {products?.length ? (
          products.map((p: any) => (
            <View key={p.id} style={styles.productRow}>
              <Text style={styles.productName}>{p.name}</Text>
              {p.valuation && (
                <Text style={styles.productMeta}>{p.valuation}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No deals yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  productRow: {
    paddingVertical: 6,
  },
  productName: {
    color: 'white',
  },
  productMeta: {
    color: '#9ca3af',
    fontSize: 12,
  },
  emptyText: {
    color: '#6b7280',
  },
});
