'use client';
import { useState, useEffect } from 'react';
import { Mail, Smartphone, Bell, Check } from 'lucide-react';
import api from '@/lib/api';

interface NotificationSettings {
  channel: 'in_app' | 'email' | 'push';
  event_type: string;
  is_enabled: boolean;
}

const notificationEvents = [
  { type: 'order_placed', label: 'Order Placed', description: 'When you place a new order' },
  { type: 'order_confirmed', label: 'Order Confirmed', description: 'When your order is confirmed' },
  { type: 'order_shipped', label: 'Order Shipped', description: 'When your order is shipped' },
  { type: 'order_delivered', label: 'Order Delivered', description: 'When your order is delivered' },
  { type: 'order_cancelled', label: 'Order Cancelled', description: 'When your order is cancelled' },
  { type: 'payment_received', label: 'Payment Received', description: 'When payment is received' },
  { type: 'payment_failed', label: 'Payment Failed', description: 'When payment fails' },
  { type: 'low_stock', label: 'Low Stock Alert', description: 'When products are running low (admin only)' },
  { type: 'back_in_stock', label: 'Back in Stock', description: 'When wishlist items are back in stock' },
  { type: 'promotion', label: 'Promotions', description: 'Special offers and discounts' },
  { type: 'abandoned_cart', label: 'Abandoned Cart', description: 'Reminders for items in your cart' },
  { type: 'price_drop', label: 'Price Drops', description: 'When wishlist items price decreases' },
  { type: 'new_review', label: 'New Reviews', description: 'When customers leave reviews (admin only)' },
  { type: 'chat_response', label: 'Chat Responses', description: 'When support replies to your messages' },
];

const channels = [
  { value: 'in_app', label: 'In-App', icon: Bell, description: 'Show notifications in the app' },
  { value: 'email', label: 'Email', icon: Mail, description: 'Receive email notifications' },
  { value: 'push', label: 'Push', icon: Smartphone, description: 'Browser push notifications' },
];

export function NotificationSettings({ userType = 'customer' }: { userType?: 'admin' | 'customer' }) {
  const [settings, setSettings] = useState<NotificationSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/notifications/settings');
      setSettings(res.data.data || []);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/notifications/settings', { settings });
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (eventType: string, channel: string) => {
    setSettings(prev => {
      const existing = prev.find(s => s.event_type === eventType && s.channel === channel);
      if (existing) {
        return prev.map(s =>
          s.event_type === eventType && s.channel === channel
            ? { ...s, is_enabled: !s.is_enabled }
            : s
        );
      } else {
        return [...prev, { event_type: eventType, channel: channel as any, is_enabled: true }];
      }
    });
  };

  const isSettingEnabled = (eventType: string, channel: string) => {
    const setting = settings.find(s => s.event_type === eventType && s.channel === channel);
    return setting?.is_enabled ?? false;
  };

  const filteredEvents = notificationEvents.filter(event => {
    if (userType === 'customer') {
      return !['low_stock', 'new_review'].includes(event.type);
    }
    return true;
  });

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading notification settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Notification Settings</h2>
          <p className="text-gray-600 mt-1">Choose how you want to receive notifications</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {filteredEvents.map(event => (
          <div key={event.type} className="bg-white border rounded-lg p-4">
            <div className="mb-3">
              <h3 className="font-semibold">{event.label}</h3>
              <p className="text-sm text-gray-600">{event.description}</p>
            </div>
            <div className="flex gap-4">
              {channels.map(channel => {
                const Icon = channel.icon;
                const enabled = isSettingEnabled(event.type, channel.value);
                return (
                  <button
                    key={channel.value}
                    onClick={() => toggleSetting(event.type, channel.value)}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      enabled
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium text-sm">{channel.label}</span>
                    {enabled && <Check size={18} className="ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
