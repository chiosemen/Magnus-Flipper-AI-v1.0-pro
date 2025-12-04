import { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Switch } from 'react-native';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <View className="flex-1 bg-background px-4 pt-12">
      <Text className="text-3xl font-bold text-white">Settings</Text>
      <Text className="text-gray-400">Profile, plan, and account controls.</Text>

      <View className="mt-6 rounded-2xl border border-slate/60 bg-surface p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-white">Dark mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
      </View>

      <View className="mt-4 rounded-2xl border border-slate/60 bg-surface p-4">
        <Text className="text-sm uppercase text-gray-400">Plan</Text>
        <Text className="text-2xl font-bold text-white">Pro</Text>
        <Text className="text-gray-400">15 saved searches • Push alerts</Text>
        <Pressable className="mt-3 rounded-xl bg-primary px-4 py-3">
          <Text className="text-center font-semibold text-background">Upgrade</Text>
        </Pressable>
      </View>

      <View className="mt-4 rounded-2xl border border-red-500/60 bg-red-500/10 p-4">
        <Text className="text-lg font-semibold text-white">Delete account</Text>
        <Text className="text-gray-300">
          Remove data across Supabase and alert workers. This cannot be undone.
        </Text>
        <Pressable
          className="mt-3 rounded-xl border border-red-500 px-4 py-3"
          onPress={() => setDeleteOpen(true)}
        >
          <Text className="text-center font-semibold text-red-400">Delete account</Text>
        </Pressable>
      </View>

      <Modal visible={deleteOpen} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full rounded-2xl bg-surface p-6">
            <Text className="text-xl font-bold text-white">Confirm deletion</Text>
            <Text className="mt-2 text-gray-300">
              This will call DELETE /api/account and sign you out.
            </Text>
            <View className="mt-4 flex-row gap-3">
              <Pressable
                className="flex-1 rounded-xl bg-slate px-4 py-3"
                onPress={() => setDeleteOpen(false)}
              >
                <Text className="text-center text-white">Cancel</Text>
              </Pressable>
              <Pressable className="flex-1 rounded-xl bg-red-500 px-4 py-3">
                <Text className="text-center font-semibold text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
