import { Tabs } from 'expo-router';

export default function Layout() {
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: '#0A0F14' },
      headerTintColor: '#E6F6FF',
      tabBarStyle: { backgroundColor: '#0A0F14', borderTopColor: '#113244' },
      tabBarActiveTintColor: '#00C4FF'
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="inventory" options={{ title: 'Inventory' }} />
      <Tabs.Screen name="wins" options={{ title: 'Wins' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
