import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export function MarketAgentGate() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Magnus Market Agent</Text>
        <Text style={styles.subtitle}>
          This feature is available on the Magnus Market Agent plan.
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Persistent market observation</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Live capture + verification signals</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Higher concurrency & freshness guarantees</Text>
          </View>
        </View>

        <Pressable
          style={styles.button}
          onPress={() => {
            // In a real app, this would open upgrade flow
            // For now, just show a message
            console.log('Upgrade to Market Agent');
          }}
        >
          <Text style={styles.buttonText}>Upgrade to Market Agent</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0d12',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: '#334155',
    maxWidth: 500,
    width: '100%',
  },
  title: {
    color: '#f9fafb',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  features: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureBullet: {
    color: '#60a5fa',
    fontSize: 16,
    marginTop: 2,
  },
  featureText: {
    color: '#cbd5e1',
    fontSize: 14,
    flex: 1,
  },
  button: {
    backgroundColor: '#00E5FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0b0d12',
    fontSize: 16,
    fontWeight: '700',
  },
});

