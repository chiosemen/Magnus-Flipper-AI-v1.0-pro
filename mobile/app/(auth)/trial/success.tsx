import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function TrialSuccessScreen() {
  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    if (!autoRedirect) return;

    if (countdown === 0) {
      handleGetStarted();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, autoRedirect]);

  const handleGetStarted = () => {
    // Navigate to main app (tabs)
    router.replace('/(tabs)');
  };

  const handleCancelAutoRedirect = () => {
    setAutoRedirect(false);
  };

  return (
    <View className="flex-1 bg-gray-900 px-6 pt-12">
      {/* Success Animation */}
      <AnimatedView
        entering={ZoomIn.delay(200).duration(600)}
        className="items-center mb-8"
      >
        <View className="bg-green-500/20 rounded-full p-6 mb-6">
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        </View>
      </AnimatedView>

      {/* Success Message */}
      <AnimatedView
        entering={FadeInUp.delay(400).duration(600)}
        className="items-center mb-8"
      >
        <Text className="text-white text-4xl font-bold mb-4 text-center">
          Trial Activated!
        </Text>
        <Text className="text-gray-400 text-lg text-center">
          Your 14-day free trial has started. Enjoy full access to all premium features.
        </Text>
      </AnimatedView>

      {/* Trial Info Cards */}
      <AnimatedView
        entering={FadeInUp.delay(600).duration(600)}
        className="mb-8"
      >
        <InfoCard
          icon="calendar"
          title="14 Days Free"
          description="Full access to all features until your trial ends"
          color="#3B82F6"
        />
        <InfoCard
          icon="notifications"
          title="Real-time Alerts"
          description="Get instant notifications for matching deals"
          color="#8B5CF6"
        />
        <InfoCard
          icon="trending-up"
          title="Start Flipping"
          description="Begin finding profitable deals right away"
          color="#10B981"
        />
      </AnimatedView>

      {/* Next Steps */}
      <AnimatedView
        entering={FadeIn.delay(800).duration(600)}
        className="bg-gray-800 rounded-lg p-4 mb-8"
      >
        <Text className="text-white font-semibold mb-3">What's Next?</Text>
        <NextStep number={1} text="Set up your first saved search" />
        <NextStep number={2} text="Configure your alert preferences" />
        <NextStep number={3} text="Start discovering profitable deals" />
      </AnimatedView>

      {/* CTA Button */}
      <AnimatedView
        entering={FadeInUp.delay(1000).duration(600)}
        className="mt-auto mb-8"
      >
        <TouchableOpacity
          className="bg-green-600 rounded-lg py-4 mb-4"
          onPress={handleGetStarted}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Get Started Now
          </Text>
        </TouchableOpacity>

        {autoRedirect && (
          <View className="items-center">
            <Text className="text-gray-400 text-sm mb-2">
              Redirecting in {countdown} seconds...
            </Text>
            <TouchableOpacity onPress={handleCancelAutoRedirect}>
              <Text className="text-blue-500 text-sm">Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </AnimatedView>
    </View>
  );
}

interface InfoCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

function InfoCard({ icon, title, description, color }: InfoCardProps) {
  return (
    <View className="bg-gray-800 rounded-lg p-4 mb-3 flex-row items-start">
      <View className="mr-4 mt-1">
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-lg mb-1">{title}</Text>
        <Text className="text-gray-400 text-sm">{description}</Text>
      </View>
    </View>
  );
}

interface NextStepProps {
  number: number;
  text: string;
}

function NextStep({ number, text }: NextStepProps) {
  return (
    <View className="flex-row items-center mb-2">
      <View className="bg-blue-500 rounded-full w-6 h-6 items-center justify-center mr-3">
        <Text className="text-white text-xs font-bold">{number}</Text>
      </View>
      <Text className="text-gray-400 flex-1">{text}</Text>
    </View>
  );
}
