import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function TrialBillingScreen() {
  const [loading, setLoading] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handleSetupBilling = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert('Error', 'You must be logged in to start a trial');
        setLoading(false);
        return;
      }

      // Create trial session
      const trialData = await api.startTrial();

      if (!trialData.setupIntentClientSecret) {
        throw new Error('Invalid trial session response');
      }

      // Initialize payment sheet with SetupIntent
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Magnus Flipper AI',
        setupIntentClientSecret: trialData.setupIntentClientSecret,
        allowsDelayedPaymentMethods: true,
        returnURL: 'magnus://trial/success',
        defaultBillingDetails: {
          email: user.email,
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        // User cancelled or error occurred
        if (presentError.code === 'Canceled') {
          setLoading(false);
          return;
        }
        throw new Error(presentError.message);
      }

      // Payment method successfully added
      // Confirm trial
      await api.confirmTrial({
        trialSessionId: trialData.trialSessionId,
      });

      // Navigate to success
      router.replace('/(auth)/trial/success');
    } catch (error: any) {
      console.error('Trial billing error:', error);
      Alert.alert(
        'Setup Failed',
        error.message || 'Failed to set up billing. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-900 px-6 pt-12">
      {/* Header */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="mb-6"
        disabled={loading}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <Text className="text-white text-4xl font-bold mb-4">
        Add Payment Method
      </Text>
      <Text className="text-gray-400 text-lg mb-8">
        We need a payment method to start your trial. You won't be charged until after the 14-day trial period.
      </Text>

      {/* Security Badge */}
      <View className="bg-gray-800 rounded-lg p-4 mb-6">
        <View className="flex-row items-center mb-3">
          <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          <Text className="text-white font-semibold text-lg ml-2">
            Secure Payment
          </Text>
        </View>
        <Text className="text-gray-400 text-sm">
          Your payment information is encrypted and securely processed by Stripe.
          We never store your card details.
        </Text>
      </View>

      {/* Trial Info */}
      <View className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-gray-400">Trial Period</Text>
          <Text className="text-white font-semibold">14 Days Free</Text>
        </View>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-gray-400">Charged Today</Text>
          <Text className="text-white font-semibold">$0.00</Text>
        </View>
        <View className="border-t border-gray-700 my-2" />
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-400">After Trial Ends</Text>
          <Text className="text-white font-semibold">$29.00/month</Text>
        </View>
      </View>

      {/* Benefits Reminder */}
      <View className="mb-auto">
        <Text className="text-gray-400 text-sm mb-3">
          With your trial, you get:
        </Text>
        <BenefitItem text="Full access to all premium features" />
        <BenefitItem text="Unlimited searches and alerts" />
        <BenefitItem text="Priority support" />
        <BenefitItem text="Cancel anytime before trial ends" />
      </View>

      {/* CTA Button */}
      <View className="pb-8">
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-4 mb-4"
          onPress={handleSetupBilling}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Add Payment Method
            </Text>
          )}
        </TouchableOpacity>

        <Text className="text-gray-500 text-xs text-center">
          You can cancel your subscription at any time from the settings.
        </Text>
      </View>
    </View>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <View className="flex-row items-center mb-2">
      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
      <Text className="text-gray-400 text-sm ml-2">{text}</Text>
    </View>
  );
}
