/**
 * Skeleton Loaders
 * Loading placeholders for better UX during data fetching
 */

import { View, type DimensionValue } from 'react-native';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
}

/**
 * Animated skeleton placeholder (enhanced with smoother animations)
 */
export function Skeleton({ width = '100%' as DimensionValue, height = 20, borderRadius = 8, className = '' }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    // Shimmer animation (smooth gradient effect)
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    shimmerAnimation.start();

    return () => {
      pulseAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [animatedValue, shimmerValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6], // Smoother opacity range
  });

  const shimmerTranslateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100], // Shimmer sweep
  });

  return (
    <View
      className={`bg-slate/50 ${className}`}
      style={{
        width,
        height,
        borderRadius,
        overflow: 'hidden',
      }}
    >
      {/* Base layer with pulse */}
      <Animated.View
        style={{
          flex: 1,
          opacity,
          backgroundColor: 'rgba(92, 224, 230, 0.15)',
        }}
      />
      {/* Shimmer layer */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX: shimmerTranslateX }],
          backgroundColor: 'rgba(92, 224, 230, 0.3)',
          width: '50%',
        }}
      />
    </View>
  );
}

/**
 * Skeleton for listing card
 */
export function ListingCardSkeleton() {
  return (
    <View className="rounded-xl border border-slate/50 bg-surface p-3">
      {/* Image skeleton */}
      <Skeleton width="100%" height={180} borderRadius={8} />
      
      {/* Title skeleton */}
      <View className="mt-2 flex-row items-center justify-between">
        <Skeleton width="70%" height={20} borderRadius={4} />
        <Skeleton width={18} height={18} borderRadius={9} />
      </View>
      
      {/* Location skeleton */}
      <Skeleton width="50%" height={16} borderRadius={4} className="mt-1" />
      
      {/* Price and condition skeleton */}
      <View className="mt-2 flex-row items-center justify-between">
        <Skeleton width={80} height={24} borderRadius={4} />
        <Skeleton width={60} height={20} borderRadius={10} />
      </View>
    </View>
  );
}

/**
 * Skeleton for feed list
 */
export function FeedListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} className="w-1/2 p-1">
          <ListingCardSkeleton />
        </View>
      ))}
    </>
  );
}

/**
 * Skeleton for detail page
 */
export function ListingDetailSkeleton() {
  return (
    <View className="flex-1 bg-background px-4 pt-12">
      {/* Image carousel skeleton */}
      <View className="w-full">
        <Skeleton width="100%" height={300} borderRadius={16} />
      </View>
      
      {/* Title skeleton */}
      <Skeleton width="90%" height={32} borderRadius={4} className="mt-4" />
      
      {/* Location skeleton */}
      <Skeleton width="60%" height={18} borderRadius={4} className="mt-2" />
      
      {/* Price skeleton */}
      <Skeleton width={120} height={28} borderRadius={4} className="mt-4" />
      
      {/* Description skeletons */}
      <Skeleton width="100%" height={16} borderRadius={4} className="mt-4" />
      <Skeleton width="95%" height={16} borderRadius={4} className="mt-2" />
      <Skeleton width="85%" height={16} borderRadius={4} className="mt-2" />
      
      {/* Button skeleton */}
      <Skeleton width="100%" height={48} borderRadius={12} className="mt-6" />
    </View>
  );
}
