import { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, SectionList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { OptimizedFeedList } from '@/components/OptimizedFeedList';
import { useOptimizedFeed } from '@/hooks/useOptimizedFeed';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useNetworkStatus } from '@/lib/offline';
import { useRouter } from 'expo-router';
import {
  CATEGORIES,
  getManufacturersForCategory,
  getModelsForManufacturer,
} from '@magnus-flipper-ai/ui-config';

function CategorySheet({
  onSelect,
  onManufacturer,
}: {
  onSelect: (category: string) => void;
  onManufacturer: () => void;
}) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['50%'], []);

  const open = () => sheetRef.current?.present();
  const close = () => sheetRef.current?.dismiss();

  return (
    <>
      <Pressable
        onPress={open}
        className="rounded-full bg-primary/20 px-4 py-2 text-white"
      >
        <Text className="text-white">Category</Text>
      </Pressable>
      <BottomSheetModal ref={sheetRef} snapPoints={snapPoints} enablePanDownToClose>
        <View className="flex-1 p-4">
          <Text className="mb-3 text-lg font-semibold text-white">Pick a category</Text>
          <FlashList
            data={CATEGORIES}
            numColumns={2}
            estimatedItemSize={80}
            renderItem={({ item }: { item: any }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item.id);
                    close();
                    onManufacturer();
                  }}
                  className="m-1 flex-1 rounded-xl border border-slate/50 bg-surface p-3"
                >
                  <Ionicons name="apps" size={18} color="#5CE0E6" />
                  <Text className="text-white">{item.label}</Text>
                </Pressable>
              )}
          />
        </View>
      </BottomSheetModal>
    </>
  );
}

export default function HomeFeed() {
  const router = useRouter();
  const [category, setCategory] = useState<string>();
  const [manufacturer, setManufacturer] = useState<string>();
  const [models, setModels] = useState<string[]>([]);
  const [manufacturerQuery, setManufacturerQuery] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [radius, setRadius] = useState<number | undefined>();
  const [conditions, setConditions] = useState<string[]>([]);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const modelSheetRef = useRef<BottomSheetModal>(null);
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['45%'], []);
  const savedSearches = useSavedSearches();
  const { isOffline } = useNetworkStatus();

  const {
    listings,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    hasNewDeals,
    isLoading,
  } = useOptimizedFeed({
    onNewDeal: (listing) => {
      router.push(`/listing/${listing.id}`);
    },
    enableNotifications: true,
  });

  const openManufacturer = () => bottomSheetRef.current?.present();

  return (
    <BottomSheetModalProvider>
      <View className="flex-1 bg-background px-4 pt-12">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs uppercase text-gray-400">Live feed</Text>
              {isOffline && (
                <Text className="text-xs uppercase text-yellow-500">Offline</Text>
              )}
              {hasNewDeals && (
                <Text className="text-xs uppercase text-primary">New deals!</Text>
              )}
            </View>
            <Text className="text-3xl font-bold text-white">Deals near you</Text>
            <Text className="text-gray-400">
              {isOffline
                ? 'Showing cached listings'
                : 'Infinite scroll feed via /api/listings/feed'}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <CategorySheet onSelect={setCategory} onManufacturer={openManufacturer} />
            <Pressable
              className="rounded-full bg-slate px-4 py-2"
              onPress={() => filterSheetRef.current?.present()}
            >
              <Text className="text-white">Filters</Text>
            </Pressable>
          </View>
        </View>

        <OptimizedFeedList
          listings={listings}
          numColumns={2}
          estimatedItemSize={280}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={isLoading}
        />

        <BottomSheetModal ref={bottomSheetRef} snapPoints={snapPoints} enablePanDownToClose>
          <View className="flex-1 p-4">
            <Text className="mb-3 text-lg font-semibold text-white">Pick a manufacturer</Text>
            <TextInput
              placeholder="Search brand"
              placeholderTextColor="#6B7280"
              className="mb-3 rounded-xl bg-slate px-3 py-2 text-white"
              value={manufacturerQuery}
              onChangeText={setManufacturerQuery}
            />
            <FlashList
              data={getManufacturersForCategory(category || '').filter((m: any) =>
                m.label.toLowerCase().includes(manufacturerQuery.toLowerCase())
              )}
              estimatedItemSize={80}
              renderItem={({ item }: { item: any }) => (
                  <Pressable
                    className="mb-2 rounded-xl border border-slate/50 bg-surface p-3"
                    onPress={() => {
                      setManufacturer(item.id);
                      modelSheetRef.current?.present();
                      bottomSheetRef.current?.dismiss();
                    }}
                  >
                    <Text className="text-white">{item.label}</Text>
                  </Pressable>
                )}
              ListEmptyComponent={
                <Text className="text-gray-400">Select a category first.</Text>
              }
            />
          </View>
        </BottomSheetModal>

        <BottomSheetModal ref={modelSheetRef} snapPoints={['60%']} enablePanDownToClose>
          <View className="flex-1 p-4">
            <Text className="mb-3 text-lg font-semibold text-white">Select models</Text>
            <SectionList
              sections={getModelsForManufacturer(manufacturer || '').map((series: any) => ({
                title: series.series,
                data: series.models,
              }))}
              keyExtractor={(item: string) => item}
              renderSectionHeader={({ section }: { section: any }) => (
                  <Text className="mt-4 text-sm font-semibold text-gray-300">
                    {section.title}
                  </Text>
                )}
              renderItem={({ item }: { item: string }) => {
                  const active = models.includes(item);
                  return (
                    <Pressable
                      className={`mt-2 rounded-lg px-3 py-2 ${
                        active ? 'bg-primary/20' : 'bg-slate'
                      }`}
                      onPress={() =>
                        setModels((prev) =>
                          prev.includes(item)
                            ? prev.filter((m) => m !== item)
                            : [...prev, item]
                        )
                      }
                    >
                      <Text className="text-white">{item}</Text>
                    </Pressable>
                  );
                }}
              ListEmptyComponent={
                <Text className="text-gray-400">Choose a manufacturer to view models.</Text>
              }
            />
          </View>
        </BottomSheetModal>

        <BottomSheetModal
          ref={filterSheetRef}
          snapPoints={['40%']}
          enablePanDownToClose
        >
          <View className="flex-1 p-4">
            <Text className="mb-3 text-lg font-semibold text-white">Filters</Text>
            <Text className="text-gray-300">Min price</Text>
            <Pressable
              className="mt-2 rounded-xl bg-slate px-4 py-3"
              onPress={() => setMinPrice((prev) => (prev ? undefined : 100))}
            >
              <Text className="text-white">{minPrice ? `$${minPrice}` : 'Any'}</Text>
            </Pressable>
            <Text className="mt-4 text-gray-300">Radius</Text>
            <Pressable
              className="mt-2 rounded-xl bg-slate px-4 py-3"
              onPress={() => setRadius((prev) => (prev ? undefined : 50))}
            >
              <Text className="text-white">{radius ? `${radius} miles` : 'Any'}</Text>
            </Pressable>
            <Text className="mt-4 text-gray-300">Condition</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'].map((cond) => {
                const active = conditions.includes(cond);
                return (
                  <Pressable
                    key={cond}
                    onPress={() =>
                      setConditions((prev) =>
                        prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
                      )
                    }
                    className={`rounded-full px-3 py-2 ${active ? 'bg-primary/20' : 'bg-slate'}`}
                  >
                    <Text className="text-white">{cond}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              className="mt-6 rounded-xl bg-primary px-4 py-3"
              onPress={() => filterSheetRef.current?.dismiss()}
            >
              <Text className="text-center font-semibold text-background">Apply</Text>
            </Pressable>
            <Pressable
              className="mt-3 rounded-xl border border-primary px-4 py-3"
              onPress={() =>
                savedSearches.create.mutate({
                  name: 'Mobile quick save',
                  category,
                  manufacturer,
                  models,
                  minPrice,
                  radiusMiles: radius,
                  conditions,
                })
              }
            >
              <Text className="text-center font-semibold text-primary">Save new search</Text>
            </Pressable>
          </View>
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
}
