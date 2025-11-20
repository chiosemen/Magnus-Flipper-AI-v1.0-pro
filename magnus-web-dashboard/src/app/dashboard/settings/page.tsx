'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Bell, Shield, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '',
    location: '',
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Profile updated successfully!');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sidebar Navigation */}
          <div className="space-y-2">
            <button className="w-full flex items-center px-4 py-3 text-left bg-blue-50 text-blue-700 rounded-lg font-medium">
              <User className="w-5 h-5 mr-3" />
              Profile
            </button>
            <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg font-medium">
              <Bell className="w-5 h-5 mr-3" />
              Notifications
            </button>
            <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg font-medium">
              <Shield className="w-5 h-5 mr-3" />
              Privacy & Security
            </button>
            <button className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg font-medium">
              <CreditCard className="w-5 h-5 mr-3" />
              Billing
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Profile Information</h2>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <Input
                    label="Full Name"
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile({ ...profile, fullName: e.target.value })
                    }
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    helperText="This email is used for login and notifications"
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                  />

                  <Input
                    label="Location"
                    value={profile.location}
                    onChange={(e) =>
                      setProfile({ ...profile, location: e.target.value })
                    }
                    placeholder="City, State"
                  />

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Change Password</h2>
              </CardHeader>
              <CardBody>
                <form className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="Enter current password"
                  />

                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Enter new password"
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                  />

                  <div className="flex justify-end">
                    <Button type="submit">Update Password</Button>
                  </div>
                </form>
              </CardBody>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <h2 className="text-xl font-semibold text-red-600">
                  Danger Zone
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Delete Account
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Once you delete your account, there is no going back.
                      Please be certain.
                    </p>
                  </div>
                  <Button variant="danger">Delete My Account</Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
