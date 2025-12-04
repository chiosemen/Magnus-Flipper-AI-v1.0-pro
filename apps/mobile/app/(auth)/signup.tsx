import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const result = await signUp(email, password);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Signup failed');
    }

    setLoading(false);
  };

  return (
    <View className="flex-1 bg-gray-900 px-6 justify-center">
      <Text className="text-white text-4xl font-bold mb-2">Create account</Text>
      <Text className="text-gray-400 text-lg mb-8">Start finding great deals</Text>

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

      <View className="mb-4">
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

      <View className="mb-6">
        <Text className="text-gray-400 mb-2">Confirm Password</Text>
        <TextInput
          className="bg-gray-800 text-white rounded-lg px-4 py-3"
          placeholder="••••••••"
          placeholderTextColor="#6B7280"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        className="bg-blue-600 rounded-lg py-4 mb-4"
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">Sign Up</Text>
        )}
      </TouchableOpacity>

      <View className="flex-row justify-center items-center">
        <Text className="text-gray-400">Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text className="text-blue-500 font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
