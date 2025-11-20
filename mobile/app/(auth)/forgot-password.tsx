import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    const result = await resetPassword(email);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to send reset email');
    }

    setLoading(false);
  };

  return (
    <View className="flex-1 bg-gray-900 px-6 justify-center">
      <Text className="text-white text-4xl font-bold mb-2">Reset password</Text>
      <Text className="text-gray-400 text-lg mb-8">
        We'll send you a link to reset your password
      </Text>

      {error ? (
        <View className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-4">
          <Text className="text-green-500">
            Check your email for a password reset link
          </Text>
        </View>
      ) : null}

      <View className="mb-6">
        <Text className="text-gray-400 mb-2">Email</Text>
        <TextInput
          className="bg-gray-800 text-white rounded-lg px-4 py-3"
          placeholder="you@example.com"
          placeholderTextColor="#6B7280"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        className="bg-blue-600 rounded-lg py-4 mb-4"
        onPress={handleResetPassword}
        disabled={loading || success}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Send Reset Link
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-gray-400 text-center">Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}
