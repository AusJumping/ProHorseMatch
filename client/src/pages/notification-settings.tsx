import React from 'react';
import PageTitle from '../components/ui/page-title';
import Layout from '../components/Layout';
import NotificationSettings from '../components/NotificationSettings';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'wouter';

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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <PageTitle 
          title="Notification Settings" 
          subtitle="Manage your notification preferences" 
        />
        <NotificationSettings />
      </div>
    </Layout>
  );
};

export default NotificationSettingsPage;