import { Stack } from 'expo-router';

export default function TrialLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0F14' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="start" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="confirm" />
      <Stack.Screen
        name="success"
        options={{
          gestureEnabled: false, // Prevent swiping back from success screen
        }}
      />
    </Stack>
  );
}
