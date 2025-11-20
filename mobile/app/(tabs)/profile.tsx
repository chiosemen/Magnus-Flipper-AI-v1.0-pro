import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { usePayments } from '@/lib/payments';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { processSubscription } = usePayments();

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      router.replace('/(auth)/login');
    }
  };

  const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
    const result = await processSubscription(plan);
    if (result.success) {
      Alert.alert('Success', 'Subscription activated!');
    } else {
      Alert.alert('Error', 'Failed to process payment');
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-900">
      <View className="p-6">
        {/* User Info */}
        <View className="bg-gray-800 rounded-lg p-6 mb-6">
          <View className="items-center mb-4">
            <View className="bg-blue-600 w-20 h-20 rounded-full items-center justify-center mb-3">
              <Text className="text-white text-3xl font-bold">
                {user?.email?.[0].toUpperCase() || 'U'}
              </Text>
            </View>
            <Text className="text-white text-xl font-bold">{user?.email}</Text>
            <View className="bg-blue-600/20 rounded-full px-4 py-1 mt-2">
              <Text className="text-blue-400 font-semibold capitalize">
                {user?.plan || 'free'}
              </Text>
            </View>
          </View>
        </View>

        {/* Subscription */}
        {user?.plan === 'free' && (
          <View className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6">
            <Text className="text-white text-2xl font-bold mb-2">Upgrade to Pro</Text>
            <Text className="text-blue-100 mb-4">
              Unlock unlimited alerts, advanced filters, and priority support
            </Text>
            <TouchableOpacity
              className="bg-white rounded-lg py-3"
              onPress={() => handleUpgrade('pro')}
            >
              <Text className="text-blue-600 text-center font-bold">
                Upgrade Now - $29/month
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Items */}
        <View className="bg-gray-800 rounded-lg mb-6 overflow-hidden">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-700">
            <Ionicons name="notifications-outline" size={24} color="#3B82F6" />
            <Text className="text-white text-lg ml-4 flex-1">Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-700">
            <Ionicons name="card-outline" size={24} color="#3B82F6" />
            <Text className="text-white text-lg ml-4 flex-1">Billing</Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4">
            <Ionicons name="help-circle-outline" size={24} color="#3B82F6" />
            <Text className="text-white text-lg ml-4 flex-1">Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          className="bg-red-600 rounded-lg py-4"
          onPress={handleSignOut}
        >
          <Text className="text-white text-center font-semibold text-lg">Sign Out</Text>
        </TouchableOpacity>

        {/* App Info */}
        <Text className="text-gray-500 text-center mt-6">
          Magnus Flipper AI v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
