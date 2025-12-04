import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const result = await signIn(email, password);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <View className="flex-1 bg-gray-900 px-6 justify-center">
      <Text className="text-white text-4xl font-bold mb-2">Welcome back</Text>
      <Text className="text-gray-400 text-lg mb-8">Sign in to continue</Text>

      {error ? (
        <View className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : null}

      <View className="mb-4">
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

      <View className="mb-6">
        <Text className="text-gray-400 mb-2">Password</Text>
        <TextInput
          className="bg-gray-800 text-white rounded-lg px-4 py-3"
          placeholder="••••••••"
          placeholderTextColor="#6B7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        className="bg-blue-600 rounded-lg py-4 mb-4"
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">Sign In</Text>
        )}
      </TouchableOpacity>

      <View className="flex-row justify-center items-center">
        <Text className="text-gray-400">Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
          <Text className="text-blue-500 font-semibold">Sign Up</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="mt-4"
        onPress={() => router.push('/(auth)/forgot-password')}
      >
        <Text className="text-gray-400 text-center">Forgot password?</Text>
      </TouchableOpacity>
    </View>
  );
}
