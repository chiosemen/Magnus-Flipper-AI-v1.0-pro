import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/lib/auth';

export default function AccountScreen() {
  const { user, loading, signIn, signOut, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setBusy(true);
    setStatus(null);
    setError(null);
    try {
      await signIn(email.trim(), password);
      setStatus('Logged in successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    setStatus(null);
    setError(null);
    try {
      await resetPassword(email.trim());
      setStatus('Password reset email sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    setStatus(null);
    setError(null);
    try {
      await signOut();
      setStatus('Signed out.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Account</Text>
        <Text style={styles.subheading}>
          Log in to sync saved searches and usage data.
        </Text>

        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator color="#00E5FF" />
          ) : user ? (
            <>
              <Text style={styles.cardTitle}>Signed in</Text>
              <Text style={styles.metaText}>{user.email}</Text>
              <Pressable style={styles.primaryButton} onPress={handleLogout}>
                <Text style={styles.primaryButtonText}>Sign out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Email login</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@company.com"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#6b7280"
                secureTextEntry
                style={styles.input}
              />
              <Pressable style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>Log in</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={handleReset}>
                <Text style={styles.secondaryButtonText}>Reset password</Text>
              </Pressable>
            </>
          )}
        </View>

        {busy && (
          <View style={styles.cardRow}>
            <ActivityIndicator color="#00E5FF" />
            <Text style={styles.mutedText}>Processing...</Text>
          </View>
        )}
        {status && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{status}</Text>
          </View>
        )}
        {error && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0d12',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  heading: {
    color: '#f9fafb',
    fontSize: 22,
    fontWeight: '700',
  },
  subheading: {
    color: '#9ca3af',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#111318',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  cardTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    color: '#f9fafb',
    backgroundColor: '#0b0d12',
  },
  primaryButton: {
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0b0d12',
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mutedText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  metaText: {
    color: '#cbd5f5',
    fontSize: 12,
  },
  successBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  successText: {
    color: '#34d399',
    fontSize: 12,
  },
  warningBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  warningText: {
    color: '#fca5a5',
    fontSize: 12,
  },
});
