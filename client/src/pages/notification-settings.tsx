import React from 'react';
import Layout from '../components/Layout';
import NotificationSettings from '../components/NotificationSettings';
import { useAuth } from '../lib/auth';
import { useLocation } from 'wouter';

const NotificationSettingsPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const [_, navigate] = useLocation();
  
  // Redirect to login if not authenticated
  if (!isAuthenticated && !isLoading) {
    navigate("/auth");
    return null;
  }

  return (
    <Layout pageTitle="Notification Settings">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-2">Notification Settings</h2>
        <p className="text-gray-600 mb-6">Manage your notification preferences</p>
        <NotificationSettings />
      </div>
    </Layout>
  );
};

export default NotificationSettingsPage;