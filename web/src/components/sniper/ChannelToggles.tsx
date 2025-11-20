'use client';

import React, { useState } from 'react';

interface ChannelTogglesProps {
  telegramEnabled: boolean;
  telegramLinked: boolean;
  onTelegramToggle: (enabled: boolean) => void;
  onTelegramLink: () => void;
  whatsappEnabled: boolean;
  whatsappLinked: boolean;
  onWhatsappToggle: (enabled: boolean) => void;
  onWhatsappLink: () => void;
  emailEnabled: boolean;
  onEmailToggle: (enabled: boolean) => void;
  userEmail: string;
  onTestAlert: (channel: string) => void;
}

export function ChannelToggles({
  telegramEnabled,
  telegramLinked,
  onTelegramToggle,
  onTelegramLink,
  whatsappEnabled,
  whatsappLinked,
  onWhatsappToggle,
  onWhatsappLink,
  emailEnabled,
  onEmailToggle,
  userEmail,
  onTestAlert,
}: ChannelTogglesProps) {
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  const handleTestAlert = async (channel: string) => {
    setTestingChannel(channel);
    await onTestAlert(channel);
    setTimeout(() => setTestingChannel(null), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Notification Channels</h3>

      {/* Telegram */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <div>
            <p className="font-medium text-sm">Telegram</p>
            {telegramLinked ? (
              <p className="text-xs text-gray-500">Connected</p>
            ) : (
              <button
                onClick={onTelegramLink}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Link via Telegram Bot →
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onTelegramToggle(!telegramEnabled)}
          disabled={!telegramLinked}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${!telegramLinked ? 'opacity-50 cursor-not-allowed' : ''}
            ${telegramEnabled && telegramLinked ? 'bg-indigo-500' : 'bg-gray-200'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${telegramEnabled && telegramLinked ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* WhatsApp */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <p className="font-medium text-sm">WhatsApp</p>
            {whatsappLinked ? (
              <p className="text-xs text-gray-500">Connected</p>
            ) : (
              <button
                onClick={onWhatsappLink}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Link phone number →
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onWhatsappToggle(!whatsappEnabled)}
          disabled={!whatsappLinked}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${!whatsappLinked ? 'opacity-50 cursor-not-allowed' : ''}
            ${whatsappEnabled && whatsappLinked ? 'bg-indigo-500' : 'bg-gray-200'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${whatsappEnabled && whatsappLinked ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Email */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📧</span>
          <div>
            <p className="font-medium text-sm">Email</p>
            <p className="text-xs text-gray-500">{userEmail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEmailToggle(!emailEnabled)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${emailEnabled ? 'bg-indigo-500' : 'bg-gray-200'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${emailEnabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Test Alert Button */}
      <button
        type="button"
        onClick={() => handleTestAlert('telegram')}
        disabled={!telegramEnabled && !whatsappEnabled && !emailEnabled}
        className={`
          w-full py-2 px-4 rounded-lg text-sm font-medium transition-all
          ${telegramEnabled || whatsappEnabled || emailEnabled
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {testingChannel ? '✓ Test sent!' : '🔔 Send test alert'}
      </button>
    </div>
  );
}
