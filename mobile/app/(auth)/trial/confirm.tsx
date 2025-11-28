import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function TrialConfirmScreen() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [trialInfo, setTrialInfo] = useState<{
    email: string;
    trialEndDate: string;
  } | null>(null);

  const params = useLocalSearchParams<{ sessionId?: string }>();

  useEffect(() => {
    loadTrialInfo();
  }, []);

  const loadTrialInfo = async () => {
    try {
      setSyncing(true);

      // Get user info
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        router.replace('/(auth)/login');
        return;
      }

      // Sync trial status
      if (params.sessionId) {
        await api.syncTrialStatus();
      }

      // Calculate trial end date (14 days from now)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      setTrialInfo({
        email: user.email || '',
        trialEndDate: trialEndDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      });
    } catch (error: any) {
      console.error('Failed to load trial info:', error);
      Alert.alert('Error', 'Failed to verify trial. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);

      // Final sync to ensure everything is set up
      await api.syncTrialStatus();

      // Navigate to success
      router.replace('/(auth)/trial/success');
    } catch (error: any) {
      console.error('Failed to confirm trial:', error);
      Alert.alert('Error', error.message || 'Failed to activate trial. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  if (syncing) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400 mt-4">Verifying your trial...</Text>
      </View>
    );
  }

  if (!trialInfo) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center px-6">
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text className="text-white text-xl font-bold mt-4 mb-2">
          Verification Failed
        </Text>
        <Text className="text-gray-400 text-center mb-6">
          We couldn't verify your trial. Please try again or contact support.
        </Text>
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-3 px-6"
          onPress={() => router.replace('/(auth)/trial/billing')}
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900 px-6 pt-12">
      {/* Header */}
      <View className="items-center mb-8">
        <View className="bg-blue-500/20 rounded-full p-4 mb-4">
          <Ionicons name="checkmark-circle" size={48} color="#3B82F6" />
        </View>
        <Text className="text-white text-3xl font-bold mb-2">
          Almost There!
        </Text>
        <Text className="text-gray-400 text-center">
          Confirm your trial details to get started
        </Text>
      </View>

      {/* Trial Details */}
      <View className="bg-gray-800 rounded-lg p-5 mb-6">
        <DetailRow
          label="Account"
          value={trialInfo.email}
          icon="mail"
        />
        <View className="border-t border-gray-700 my-4" />
        <DetailRow
          label="Trial Period"
          value="14 Days Free"
          icon="time"
        />
        <View className="border-t border-gray-700 my-4" />
        <DetailRow
          label="Trial Ends"
          value={trialInfo.trialEndDate}
          icon="calendar"
        />
        <View className="border-t border-gray-700 my-4" />
        <DetailRow
          label="Monthly Price After Trial"
          value="$29.00"
          icon="card"
        />
      </View>

      {/* Important Notice */}
      <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
        <View className="flex-row items-start">
          <Ionicons name="warning" size={20} color="#F59E0B" />
          <View className="flex-1 ml-3">
            <Text className="text-yellow-500 font-semibold mb-1">
              Important
            </Text>
            <Text className="text-gray-400 text-sm">
              Your subscription will automatically start at $29/month after the trial period unless you cancel before {trialInfo.trialEndDate}.
            </Text>
          </View>
        </View>
      </View>

      {/* CTA Buttons */}
      <View className="mb-8 mt-auto">
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-4 mb-3"
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Activate My Trial
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3"
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text className="text-gray-400 text-center">Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function DetailRow({ label, value, icon }: DetailRowProps) {
  return (
    <View className="flex-row items-center">
      <View className="bg-gray-700 rounded-full p-2 mr-3">
        <Ionicons name={icon} size={16} color="#9CA3AF" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-400 text-sm mb-1">{label}</Text>
        <Text className="text-white font-semibold">{value}</Text>
      </View>
    </View>
  );
}
