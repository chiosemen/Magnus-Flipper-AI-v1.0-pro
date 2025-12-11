/**
 * Image Cache Layer
 * Optimized image loading with caching, placeholder, and error handling
 */

import { Image } from 'expo-image';
import { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export interface CachedImageProps {
  uri?: string | null;
  placeholder?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  borderRadius?: number;
  className?: string;
  priority?: 'low' | 'normal' | 'high';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Cached image component with automatic caching
 * Uses expo-image for native performance
 */
export function CachedImage({
  uri,
  placeholder,
  width,
  height,
  aspectRatio,
  borderRadius = 12,
  className = '',
  priority = 'normal',
  onLoad,
  onError,
}: CachedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!uri || hasError) {
    return (
      <View
        className={`bg-gradient-to-br from-accent/20 to-primary/10 ${className}`}
        style={{
          width,
          height: height || (width && aspectRatio ? width / aspectRatio : 200),
          borderRadius,
        }}
      />
    );
  }

  return (
    <View style={{ width, height, borderRadius, overflow: 'hidden' }}>
      <Image
        source={{ uri }}
        placeholder={placeholder}
        contentFit="cover"
        transition={200}
        priority={priority}
        cachePolicy="memory-disk"
        recyclingKey={uri}
        // Enhanced caching options
        allowDownscaling={true}
        contentPosition="center"
        // Optimize for performance
        enableMemoryCache={true}
        enableDiskCache={true}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
          onError?.();
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
      {isLoading && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
        >
          <ActivityIndicator size="small" color="#5CE0E6" />
        </View>
      )}
    </View>
  );
}

/**
 * Preload images for better performance (enhanced)
 * Prioritizes visible images and batches loading
 */
export async function preloadImages(
  uris: string[],
  options: {
    priority?: 'low' | 'normal' | 'high';
    batchSize?: number;
  } = {}
): Promise<void> {
  const { priority = 'normal', batchSize = 5 } = options;
  
  try {
    const validUris = uris.filter((uri) => uri != null) as string[];
    
    // Batch loading to avoid overwhelming the network
    for (let i = 0; i < validUris.length; i += batchSize) {
      const batch = validUris.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map((uri) =>
          Image.prefetch(uri, {
            cachePolicy: 'memory-disk',
            priority: priority === 'high' ? 'high' : 'normal',
          })
        )
      );
      
      // Small delay between batches to avoid blocking
      if (i + batchSize < validUris.length) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  } catch (error) {
    console.warn('Image preload error:', error);
  }
}

/**
 * Clear image cache
 */
export async function clearImageCache(): Promise<void> {
  try {
    await Image.clearMemoryCache();
    await Image.clearDiskCache();
  } catch (error) {
    console.warn('Image cache clear error:', error);
  }
}

/**
 * Get cache size (approximate)
 */
export async function getImageCacheSize(): Promise<number> {
  // expo-image doesn't expose cache size directly
  // This is a placeholder for future implementation
  return 0;
}
