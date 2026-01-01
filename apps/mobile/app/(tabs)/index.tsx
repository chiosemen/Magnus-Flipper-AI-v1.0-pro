import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { MarketAgentGate } from '@/components/MarketAgentGate';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type UsageResponse = {
  features: {
    marketAgent: {
      enabled: boolean;
      status: string;
      graceUntil?: string | null;
    };
  };
  limits: {
    marketAgent: {
      runsPerDay: number;
      maxItemsPerDay: number;
    };
  };
  usage: {
    marketAgent: {
      today: {
        runs: number;
        itemsReturned: number;
      };
    };
  };
};

export default function HomeScreen() {
  const router = useRouter();
  const { state, setEntitlement, setUsage } = useApp();
  const { token } = useAuth();

  useEffect(() => {
    // Load entitlement and usage on mount
    if (token) {
      loadUsage();
    }
  }, [token]);

  const loadUsage = async () => {
    try {
      const { response, json } = await apiRequest<UsageResponse>(
        '/api/usage',
        { method: 'GET' },
        token,
        false
      );

      if (response.ok) {
        setEntitlement(json.features?.marketAgent || null);
        setUsage({
          runs: json.usage?.marketAgent?.today?.runs || 0,
          itemsReturned: json.usage?.marketAgent?.today?.itemsReturned || 0,
          runsPerDay: json.limits?.marketAgent?.runsPerDay || 250,
          itemsPerDay: json.limits?.marketAgent?.maxItemsPerDay || 20000,
        });
      }
    } catch (err) {
      console.error('Failed to load usage:', err);
    }
  };

  // Show gate if not entitled (unless in demo mode)
  if (!state.demoMode && !state.entitlement?.enabled) {
    return <MarketAgentGate />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Magnus Market Agent</Text>
        <Text style={styles.subheading}>
          Search live marketplace listings with real-time data
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Text style={styles.buttonText}>Start Searching</Text>
        </Pressable>

        {state.entitlement && (
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={styles.statusValue}>
              {state.entitlement.status === 'active' ? 'Active' : state.entitlement.status}
            </Text>
            {state.entitlement.graceUntil && (
              <Text style={styles.graceText}>
                Grace period until {new Date(state.entitlement.graceUntil).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {state.usage && (
          <View style={styles.usageCard}>
            <Text style={styles.usageLabel}>Usage Today</Text>
            <Text style={styles.usageValue}>
              {state.usage.runs} / {state.usage.runsPerDay} runs
            </Text>
            <Text style={styles.usageValue}>
              {state.usage.itemsReturned} / {state.usage.itemsPerDay} items
            </Text>
          </View>
        )}

        {state.demoMode && (
          <View style={styles.demoCard}>
            <Text style={styles.demoText}>Running in demo mode</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0d12',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 24,
  },
  heading: {
    color: '#f9fafb',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  subheading: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#00E5FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#0b0d12',
    fontSize: 18,
    fontWeight: '700',
  },
  statusCard: {
    backgroundColor: '#111318',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 4,
  },
  statusLabel: {
    color: '#9ca3af',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusValue: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '600',
  },
  graceText: {
    color: '#facc15',
    fontSize: 12,
    marginTop: 4,
  },
  usageCard: {
    backgroundColor: '#111318',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 8,
  },
  usageLabel: {
    color: '#9ca3af',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  usageValue: {
    color: '#f9fafb',
    fontSize: 14,
  },
  demoCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  demoText: {
    color: '#fbbf24',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
