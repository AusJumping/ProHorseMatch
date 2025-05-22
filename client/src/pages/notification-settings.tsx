import React from 'react';
import PageTitle from '../components/ui/page-title';
import NotificationSettings from '../components/NotificationSettings';
import { Helmet } from 'react-helmet';

const NotificationSettingsPage = () => {
  return (
    <>
      <Helmet>
        <title>Notification Settings - ProHorseMatch</title>
        <meta name="description" content="Manage your notification preferences for horse matches and messages on ProHorseMatch." />
      </Helmet>
      <div className="container mx-auto py-6 px-4">
        <PageTitle title="Notification Settings" />
        <div className="mt-6">
          <NotificationSettings />
        </div>
      </div>
    </>
  );
};

export default NotificationSettingsPage;