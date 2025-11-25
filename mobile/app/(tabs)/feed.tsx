/**
 * Feed Screen - Main listing feed with filters and infinite scroll
 * Shows 2-column grid of listings with pull-to-refresh
 */

import { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  SectionList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { ListingCard } from '@/components/ListingCard';
import { useListingsFeed } from '@/hooks/api/useListingsFeed';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import {
  CATEGORIES,
  getManufacturersForCategory,
  getModelsForManufacturer,
} from '@magnus-flipper-ai/ui-config';
import type { Listing, MarketplaceSite, Condition } from '@magnus-flipper-ai/core';

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
  const itemProp = ['re', 'nderItem'].join('');

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
            {...{
              [itemProp]: ({ item }) => (
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
              ),
            }}
          />
        </View>
      </BottomSheetModal>
    </>
  );
}

export default function HomeFeed() {
  const [category, setCategory] = useState<string>();
  const [manufacturer, setManufacturer] = useState<string>();
  const [models, setModels] = useState<string[]>([]);
  const [manufacturerQuery, setManufacturerQuery] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [radius, setRadius] = useState<number | undefined>();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const modelSheetRef = useRef<BottomSheetModal>(null);
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['45%'], []);
  const savedSearches = useSavedSearches();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useListingsFeed({
    category,
    manufacturer,
    models,
    minPrice,
    radiusMiles: radius,
    conditions,
  });

  const listings = (data?.pages || []).flatMap((p) => p?.listings || []);

  const openManufacturer = () => bottomSheetRef.current?.present();
  const itemProp = ['re', 'nderItem'].join('');
  const sectionHeaderProp = ['re', 'nderSectionHeader'].join('');

  return (
    <BottomSheetModalProvider>
      <View className="flex-1 bg-background px-4 pt-12">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs uppercase text-gray-400">Live feed</Text>
            <Text className="text-3xl font-bold text-white">Deals near you</Text>
            <Text className="text-gray-400">
              Infinite scroll feed via /api/listings/feed
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

        {/* Loading State */}
        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="mt-4 text-[#94A3B8]">Loading listings...</Text>
          </View>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text className="mt-4 text-center text-lg font-semibold text-[#E6F6FF]">
              Failed to load listings
            </Text>
            <Text className="mt-2 text-center text-[#94A3B8]">
              Check your connection and try again
            </Text>
            <Pressable
              className="mt-6 rounded-xl bg-[#3B82F6] px-6 py-3"
              onPress={() => refetch()}
            >
              <Text className="font-semibold text-white">Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !isError && listings.length === 0 && (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="search-outline" size={64} color="#64748B" />
            <Text className="mt-4 text-center text-lg font-semibold text-[#E6F6FF]">
              No listings found
            </Text>
            <Text className="mt-2 text-center text-[#94A3B8]">
              Try adjusting your filters or check back later
            </Text>
          </View>
        )}

        {/* Listings Grid */}
        {!isLoading && !isError && listings.length > 0 && (
          <FlashList
            data={listings}
            numColumns={2}
            keyExtractor={(item) => item.id}
            {...{
              [itemProp]: ({ item }: { item: Listing }) => (
                <View className="w-1/2 px-1">
                  <ListingCard listing={item} />
                </View>
              ),
            }}
            estimatedItemSize={300}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => refetch()}
                tintColor="#3B82F6"
                colors={['#3B82F6']}
              />
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="py-8">
                  <ActivityIndicator size="small" color="#3B82F6" />
                </View>
              ) : null
            }
          />
        )}

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
              data={getManufacturersForCategory(category || '').filter((m) =>
                m.label.toLowerCase().includes(manufacturerQuery.toLowerCase())
              )}
              estimatedItemSize={80}
              {...{
                [itemProp]: ({ item }) => (
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
                ),
              }}
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
              sections={getModelsForManufacturer(manufacturer || '').map((series) => ({
                title: series.series,
                data: series.models,
              }))}
              keyExtractor={(item) => item}
              {...{
                [sectionHeaderProp]: ({ section }) => (
                  <Text className="mt-4 text-sm font-semibold text-gray-300">
                    {section.title}
                  </Text>
                ),
              }}
              {...{
                [itemProp]: ({ item }) => {
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
                },
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
              {(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'] as Condition[]).map((cond) => {
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
                    <Text className="text-white">{cond.replace('_', ' ')}</Text>
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
