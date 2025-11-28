import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TrialStartScreen() {
  const [loading, setLoading] = useState(false);

  const handleStartTrial = () => {
    setLoading(true);
    // Navigate to billing screen
    router.push('/(auth)/trial/billing');
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="px-6 pt-12 pb-6">
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-6"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text className="text-white text-4xl font-bold mb-4">
          Start Your Free Trial
        </Text>
        <Text className="text-gray-400 text-lg mb-8">
          Get full access to Magnus Flipper AI for 14 days, completely free.
        </Text>

        {/* Features List */}
        <View className="mb-8">
          <FeatureItem
            icon="search"
            title="Unlimited Searches"
            description="Create and save as many searches as you need"
          />
          <FeatureItem
            icon="notifications"
            title="Real-time Alerts"
            description="Get instant notifications for matching deals"
          />
          <FeatureItem
            icon="analytics"
            title="AI-Powered Analysis"
            description="Advanced profit margin calculations and insights"
          />
          <FeatureItem
            icon="star"
            title="Premium Support"
            description="Priority customer support via email and chat"
          />
          <FeatureItem
            icon="trending-up"
            title="Market Intelligence"
            description="Access to trending products and market data"
          />
        </View>

        {/* Trial Terms */}
        <View className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-blue-400 font-semibold mb-1">
                14-Day Free Trial
              </Text>
              <Text className="text-gray-400 text-sm">
                Your trial starts today. You won't be charged until the trial period ends.
                Cancel anytime before the trial ends to avoid charges.
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Info */}
        <View className="bg-gray-800 rounded-lg p-4 mb-6">
          <Text className="text-gray-400 text-sm mb-2">After trial ends:</Text>
          <View className="flex-row items-baseline">
            <Text className="text-white text-3xl font-bold">$29</Text>
            <Text className="text-gray-400 text-lg ml-1">/month</Text>
          </View>
          <Text className="text-gray-500 text-sm mt-1">
            Billed monthly. Cancel anytime.
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-4 mb-4"
          onPress={handleStartTrial}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Continue to Billing
            </Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <Text className="text-gray-500 text-xs text-center leading-5">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          {'\n'}
          You can cancel your trial at any time before it ends.
        </Text>
      </View>
    </ScrollView>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <View className="flex-row items-start mb-6">
      <View className="bg-blue-500/20 rounded-full p-2 mr-4">
        <Ionicons name={icon} size={20} color="#3B82F6" />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-lg mb-1">{title}</Text>
        <Text className="text-gray-400">{description}</Text>
      </View>
    </View>
  );
}
