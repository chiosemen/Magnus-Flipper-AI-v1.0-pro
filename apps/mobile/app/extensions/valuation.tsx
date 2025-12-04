// mobile/app/extensions/valuation.tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { aiValuation } from '@/lib/magnusClient';

export default function ValuationExtensionScreen() {
  const [name, setName] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runValuation() {
    try {
      if (!name.trim()) {
        Alert.alert('Missing name', 'Enter a product name first.');
        return;
      }
      setLoading(true);
      const res = await aiValuation(name.trim());
      setResult(res?.valuation ?? JSON.stringify(res));
    } catch (e: any) {
      console.error('[Valuation] error', e);
      Alert.alert('Error', e?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>AI Valuation</Text>
      <Text style={styles.subtitle}>
        Send the product to the Magnus AI valuation engine.
      </Text>

      <Text style={styles.label}>Product Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. PS5 Disc Edition – New"
        placeholderTextColor="#6b7280"
        value={name}
        onChangeText={setName}
      />

      <Pressable
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={runValuation}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Running…' : 'Run Valuation'}
        </Text>
      </Pressable>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Result</Text>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
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
    fontSize: 22,
    color: 'white',
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: '#9ca3af',
  },
  label: {
    marginTop: 20,
    color: '#e5e7eb',
  },
  input: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: 'white',
  },
  button: {
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#022c22',
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#020617',
    padding: 16,
  },
  resultTitle: {
    color: '#e5e7eb',
    fontWeight: '600',
    marginBottom: 8,
  },
  resultText: {
    color: '#d1d5db',
  },
});
