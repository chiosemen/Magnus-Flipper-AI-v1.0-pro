// mobile/app/dashboard.tsx
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useAuth } from '@/store/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/magnusClient';
import { Link } from 'expo-router';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Magnus Dashboard</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products</Text>
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
          <Text style={styles.emptyText}>No products yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Extensions</Text>
        <Link href="/extensions/valuation" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Open AI Valuation</Text>
          </Pressable>
        </Link>
      </View>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
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
  subtitle: {
    marginTop: 4,
    color: '#9ca3af',
  },
  section: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
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
  button: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#022c22',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  logoutText: {
    color: '#f87171',
  },
});
