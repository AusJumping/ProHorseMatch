# ProHorseMatch

## Overview
ProHorseMatch is a Tinder-style matching application designed to connect professional riders with performance horses for sale. It leverages smart technology for horse-buyer matching, offering features like swipe-based browsing, advanced filtering, and direct communication between users. The platform aims to streamline the horse purchasing process, providing a specialized marketplace for high-value equine transactions.

## User Preferences
Preferred communication style: Simple, everyday language.
Focus on web app development until reliable mobile developer found.

## Recent Changes (October 13, 2025)
- **NEW**: PWA App Icons with Custom Branding
- Generated 192x192 and 512x512 app icons with ProHorseMatch logo on #2b2b2b background
- Updated PWA manifest with custom background and theme colors (#2b2b2b)
- Icons optimized for home screen installation on iOS and Android
- Added maskable icon support for better cross-platform appearance
- **NEW**: Push Notification Sending System
- Implemented complete push notification delivery using web-push library
- Push notifications for new matches when horses match saved searches
- Push notifications for new messages in conversations
- Push notifications for horse listing updates (price changes, photo updates, details)
- Notifications respect user preferences (notify_matches, notify_messages, notify_updates)
- Invalid subscriptions automatically removed on 404/410 errors
- iOS installation instructions added to notification settings with step-by-step PWA setup guide
- **NEW**: Web Push Notification System via PWA (October 12, 2025)
- Implemented full PWA (Progressive Web App) infrastructure for push notifications
- Created push_subscriptions database table to store user notification preferences
- Added backend API routes: /api/push/subscribe, /api/push/unsubscribe, /api/push/status
- Built NotificationSettings component with browser compatibility checks and install prompts
- Integrated notification settings into user profile page under "Account Settings" tab
- Service worker configured to handle push notification events
- VAPID keys securely stored in Replit Secrets for authentication
- Platform support: Android Chrome, desktop browsers (requires PWA install for iOS 16.4+)
- **STATUS**: Push notification system fully functional and actively sending notifications

## Previous Changes (September 1-3, 2025)
- **RESOLVED**: Fixed critical authentication mismatch in upload system
- Removed authentication requirement from local upload fallback endpoint (`/api/upload`)
- Enhanced error handling to show specific response codes and error messages
- Upload system now works perfectly with Cloudinary primary and local storage fallback
- Both photo and video uploads verified working in development
- **COMPLETED**: Admin horse editing fully functional
- Admin can edit all horses through admin panel with Edit button
- Fixed TypeScript validation errors preventing form submission
- Admin users properly redirected to admin panel after successful updates
- Backend permissions allow admin override of ownership restrictions
- Cache invalidation ensures admin panel shows updated data immediately
- **NEW**: Email notification system for new horse listings
- Set up automated email notifications to info@australianjumping.com.au when horses are listed
- Created horse listing notification email template with professional branding
- Integrated notification system into horse creation workflow
- Sally Empringham upgraded to Beta Seller subscription (valid until November 1, 2025)

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query (server state and API caching)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **Server**: Express.js with TypeScript
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (via Neon serverless)
- **Authentication**: Session-based with express-session
- **API**: RESTful design
- **Media Storage**: Cloudinary (images and videos)
- **Payments**: Stripe

### UI/UX and Design Decisions
- **Styling**: Custom color scheme (browns, golds, neutrals) using Tailwind CSS.
- **Components**: Radix UI components via shadcn/ui.
- **Typography**: Inter, Playfair Display, Montserrat.
- **Responsiveness**: Mobile-first design approach.
- **Key Features**:
    - **User Management**: Unified user model for searchers and sellers, dual role system, session-based authentication, separate profile management.
    - **Horse Listings**: Comprehensive schema including disciplines, breeds, characteristics; multi-currency support (USD, GBP, EUR, AUD, NZD); location-based filtering.
    - **Matching System**: Tinder-style swipe interface, advanced multi-criteria filtering, favorites system, match tracking.
    - **Communication**: Real-time direct messaging between buyers and sellers, threaded conversations.
    - **Payment Integration**: Secure payment processing via Stripe for premium features and subscriptions.
    - **Admin Dashboard**: Analytics, user and horse management with restricted access.
    - **Authentication**: Bcrypt password hashing, email verification, 1-hour auto-logout with activity tracking.

### Core System Flows
- **User Registration**: Users can sign up as searchers, sellers, or both.
- **Horse Listing**: Sellers create detailed horse profiles with media uploads.
- **Discovery**: Searchers browse horses via swipe or grid view, utilizing filters.
- **Matching**: System tracks user interactions (likes/dislikes) and saves favorites.
- **Communication**: Direct messaging facilitates interaction between interested parties.
- **Transaction**: Payment processing supports premium features and subscriptions.

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL hosting.
- **Cloudinary**: Image and video storage, optimization.
- **Stripe**: Payment processing and subscriptions.
- **Resend**: Email delivery service (for verification and password resets).

### Development & UI Libraries
- **Drizzle Kit**: Database migrations and schema management.
- **Capacitor**: Mobile app compilation (iOS/Android).
- **Radix UI**: Accessible component primitives.
- **Lucide React**: Icon library.
- **Zod**: Runtime type validation.