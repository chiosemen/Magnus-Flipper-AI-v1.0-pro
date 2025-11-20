'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MarketplaceSelector,
  PriceRangeSlider,
  ConditionSelector,
  LocationPicker,
  AlertSettings,
  ChannelToggles,
  SummaryPanel,
} from '@/components/sniper';

export default function CreateSniperPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [marketplace, setMarketplace] = useState('facebook');
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [conditions, setConditions] = useState<string[]>(['any']);
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(10);

  // Alert settings
  const [filterByUndervalue, setFilterByUndervalue] = useState(true);
  const [undervalueThreshold, setUndervalueThreshold] = useState(20);
  const [maxAlertsPerDay, setMaxAlertsPerDay] = useState(10);

  // Channels
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappLinked, setWhatsappLinked] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const handleTelegramLink = async () => {
    try {
      const response = await fetch('/api/telegram/link/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.link) {
        window.open(data.link, '_blank');
      }
    } catch (error) {
      console.error('Failed to start Telegram link:', error);
    }
  };

  const handleWhatsappLink = async () => {
    // TODO: Open WhatsApp linking modal
    console.log('Open WhatsApp linking');
  };

  const handleTestAlert = async (channel: string) => {
    try {
      await fetch('/api/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
    } catch (error) {
      console.error('Failed to send test alert:', error);
    }
  };

  const handleSaveDraft = () => {
    const draft = {
      marketplace,
      query,
      minPrice,
      maxPrice,
      conditions,
      location,
      radius,
      filterByUndervalue,
      undervalueThreshold,
      maxAlertsPerDay,
      telegramEnabled,
      whatsappEnabled,
      emailEnabled,
    };
    localStorage.setItem('sniper_draft', JSON.stringify(draft));
    alert('Draft saved!');
  };

  const handleSubmit = async () => {
    if (!query) {
      alert('Please enter a search query');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${query} - ${marketplace}`,
          marketplace,
          query,
          min_price: minPrice,
          max_price: maxPrice,
          location,
          radius_km: radius,
          conditions,
          undervalue_threshold: filterByUndervalue ? undervalueThreshold : 0,
          max_alerts_per_day: maxAlertsPerDay,
          scan_interval_seconds: 60,
        }),
      });

      if (response.ok) {
        const profile = await response.json();
        router.push(`/sniper/${profile.id}`);
      } else {
        const error = await response.json();
        alert(`Failed to create profile: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert('Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Sniper Search</h1>
          <p className="text-gray-600 mt-1">
            Set up automated deal hunting for marketplace listings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section 1: Marketplace */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <MarketplaceSelector
                selected={marketplace}
                onChange={setMarketplace}
              />
            </div>

            {/* Section 2: Search Criteria */}
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are you hunting?
                </label>
                <input
                  type="text"
                  placeholder="ps5, iphone 15, golf gti..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <PriceRangeSlider
                minPrice={minPrice}
                maxPrice={maxPrice}
                onMinChange={setMinPrice}
                onMaxChange={setMaxPrice}
              />

              <ConditionSelector
                selected={conditions}
                onChange={setConditions}
              />

              <LocationPicker
                location={location}
                onLocationChange={setLocation}
                radius={radius}
                onRadiusChange={setRadius}
              />
            </div>

            {/* Section 3: Alert Logic */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <AlertSettings
                filterByUndervalue={filterByUndervalue}
                onFilterToggle={setFilterByUndervalue}
                undervalueThreshold={undervalueThreshold}
                onThresholdChange={setUndervalueThreshold}
                maxAlertsPerDay={maxAlertsPerDay}
                onMaxAlertsChange={setMaxAlertsPerDay}
              />
            </div>

            {/* Section 4: Channels */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <ChannelToggles
                telegramEnabled={telegramEnabled}
                telegramLinked={telegramLinked}
                onTelegramToggle={setTelegramEnabled}
                onTelegramLink={handleTelegramLink}
                whatsappEnabled={whatsappEnabled}
                whatsappLinked={whatsappLinked}
                onWhatsappToggle={setWhatsappEnabled}
                onWhatsappLink={handleWhatsappLink}
                emailEnabled={emailEnabled}
                onEmailToggle={setEmailEnabled}
                userEmail="user@example.com"
                onTestAlert={handleTestAlert}
              />
            </div>
          </div>

          {/* Summary Panel */}
          <div className="lg:col-span-1">
            <SummaryPanel
              query={query}
              location={location}
              radius={radius}
              marketplace={marketplace}
              maxAlertsPerDay={maxAlertsPerDay}
              telegramEnabled={telegramEnabled}
              whatsappEnabled={whatsappEnabled}
              emailEnabled={emailEnabled}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
