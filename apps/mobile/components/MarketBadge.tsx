import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type BadgeVariant = 'verified' | 'live-capture' | 'recent' | 'in-progress';

const BADGE_LABEL: Record<BadgeVariant, string> = {
  verified: 'VERIFIED',
  'live-capture': 'LIVE CAPTURE',
  recent: 'RECENT',
  'in-progress': 'IN PROGRESS',
};

const badgeColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  verified: {
    bg: 'rgba(16, 185, 129, 0.15)',
    text: '#6ee7b7',
    border: 'rgba(16, 185, 129, 0.4)',
  },
  'live-capture': {
    bg: 'rgba(14, 165, 233, 0.15)',
    text: '#7dd3fc',
    border: 'rgba(14, 165, 233, 0.4)',
  },
  recent: {
    bg: 'rgba(139, 92, 246, 0.15)',
    text: '#a78bfa',
    border: 'rgba(139, 92, 246, 0.4)',
  },
  'in-progress': {
    bg: 'rgba(245, 158, 11, 0.15)',
    text: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.4)',
  },
};

export function MarketBadge({ variant }: { variant: BadgeVariant }) {
  const colors = badgeColors[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {BADGE_LABEL[variant]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

