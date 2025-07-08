# ProHorseMatch

## Overview

ProHorseMatch is a Tinder-style matching application that connects professional riders with performance horses for sale. The platform uses smart technology to match buyers with horses based on their preferences, allowing users to swipe through horse listings, set filters, and communicate directly with sellers.

## System Architecture

This is a full-stack web application built with modern technologies:

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **Wouter** for client-side routing
- **TanStack Query** for server state management and API caching
- **Tailwind CSS** with shadcn/ui components for styling
- **React Hook Form** with Zod validation for form handling
- **Capacitor** for mobile app deployment (iOS/Android)

### Backend Architecture
- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL** database (via Neon serverless)
- **Session-based authentication** with express-session
- **RESTful API** design pattern
- **Cloudinary** for image storage and management
- **Stripe** for payment processing

### Styling and UI
- **Tailwind CSS** with custom color scheme (browns, golds, neutrals)
- **Radix UI** components via shadcn/ui
- **Font stack**: Inter, Playfair Display, Montserrat
- **Responsive design** with mobile-first approach

## Key Components

### User Management
- **Unified User Model**: Single users table supporting both searching and selling roles
- **Dual Role System**: Users can be searchers, sellers, or both
- **Authentication**: Session-based auth with secure login/logout
- **Profile Management**: Separate profiles for different user types

### Horse Listings
- **Comprehensive Horse Schema**: Detailed attributes including disciplines, breeds, characteristics
- **Media Management**: Photo and video uploads via Cloudinary
- **Price Management**: Multi-currency support (USD, GBP, EUR, AUD, NZD)
- **Location-based Filtering**: Country and radius-based searches

### Matching System
- **Swipe Interface**: Tinder-style card swiping for horse discovery
- **Advanced Filtering**: Multiple criteria including discipline, breed, age, height, price
- **Favorites System**: Save liked horses for later review
- **Match Tracking**: Store user preferences and matches

### Communication
- **Real-time Messaging**: Direct communication between buyers and sellers
- **Conversation Management**: Threaded conversations per horse listing
- **Contact Information**: Business contact details for sellers

### Payment Integration
- **Stripe Integration**: Secure payment processing
- **Subscription Model**: Premium features for enhanced access
- **Multi-currency Support**: Localized pricing
- **Donation System**: Support platform development

## Data Flow

1. **User Registration**: Users sign up as searchers, sellers, or both
2. **Horse Listing**: Sellers create detailed horse profiles with media
3. **Discovery**: Searchers browse horses via swipe interface or grid view
4. **Matching**: System tracks likes/dislikes and saves favorites
5. **Communication**: Direct messaging between interested parties
6. **Transaction**: Payment processing for premium features

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL hosting
- **Cloudinary**: Image/video storage and optimization
- **Stripe**: Payment processing and subscriptions
- **Anthropic AI**: AI-powered features (configured but not actively used)

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production bundling
- **Capacitor**: Mobile app compilation

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation

## Deployment Strategy

### Development Environment
- **Replit**: Primary development platform
- **Hot Module Replacement**: Vite HMR for rapid development
- **PostgreSQL**: Provisioned via Replit modules

### Production Build
- **Static Assets**: Vite builds frontend to `/dist/public`
- **Server Bundle**: ESBuild bundles server to `/dist/index.js`
- **Autoscale Deployment**: Configured for automatic scaling

### Mobile Deployment
- **Capacitor**: Configured for iOS and Android builds
- **App Store Ready**: Proper metadata and icons configured

### Environment Configuration
- Database URL and Stripe keys via environment variables
- Cloudinary credentials for media management
- Session secrets for authentication security

## Changelog

- July 8, 2025: Navigation and UI improvements completed
  - FIXED: Level dropdown restored in filter section with improved UX logic
  - Level dropdown now shows as disabled with helpful message when no discipline selected
  - FIXED: "Any Level" filtering bug - backend now properly handles "any_level" selection by skipping level filtering
  - RESOLVED: Discipline switching now works correctly (Dressage to Jumping shows proper horses)
  - FIXED: Toast message duration standardized to 5 seconds across all notifications
  - Changed TOAST_REMOVE_DELAY from 1,000,000ms to 5,000ms for consistent user experience
  - Enhanced price privacy: detail page prices only visible to horse owners
  - Updated "More Info" button styling to black background with white text across mobile and desktop
  - COMPLETED: Main navigation menu items now have gold background (#cdac6e) with white text on hover
  - Consistent hover styling applied to all sidebar menu items: Find Horses, My Favorites, Messages, Saved Searches, My Horses, Add Horse, Profile, Subscription, and Logout
  - COMPLETED: "More Info" button hover state updated to gold background (#cdac6e) with white text for brand consistency
  - ADDED: Duplicate "Reset All" button to top right of Filter box header next to "Find Horses" title for improved user accessibility
  - COMPLETED: "Reset All" buttons hover state updated to gold background (#cdac6e) with white text for consistent brand styling
  - IMPLEMENTED: Auto-apply functionality for all dropdown filters - filters now apply immediately when values change without requiring "Apply Filters" button click
  - Updated all dropdowns (Discipline, Level, Breeds, Sex, Age Range, Height Range, Location) to use auto-apply feature for improved user experience
  - Complete instant filtering: select any dropdown value and horse results update immediately for seamless browsing
- July 7, 2025: Password reset system fixes and UI improvements  
  - FIXED: Password reset emails now send proper reset content instead of email verification content
  - Created dedicated sendPasswordResetEmail function with professional reset template
  - Fixed API parameter order issue causing "Method is not a valid HTTP token" error in forgot password
  - Changed registration page title from "Searching Registration" to "Registration Details" for clarity
  - Added comprehensive browser-specific CSS for password placeholder compatibility across all browsers
  - Enhanced password field styling for Chrome, Safari, Firefox, Edge (legacy and modern), and IE
  - Ensured no misleading dots appear in password placeholders on any browser platform
- July 7, 2025: Complete email verification system operational with custom domain
  - RESOLVED: Email verification now working end-to-end with custom domain prohorsematch.com
  - Configured Resend email service to use verified domain noreply@prohorsematch.com
  - Complete flow verified: registration → email delivery → verification → login → app access
  - Email notifications display consistently during registration process
  - Production-ready email system now fully functional for all users
- July 3, 2025: Email verification notification system fixed and restored
  - CRITICAL FIX: Resolved email verification notification not appearing during registration
  - Issue was caused by Resend email service domain restrictions (testing mode only allows info@australianjumping.com.au)
  - Frontend toast notification system confirmed working correctly - backend always worked properly
  - Email verification message now displays consistently: "Registration successful! Please check your email to verify your account before logging in."
  - Complete registration flow verified: form submission → backend processing → email verification toast display
  - System fully operational again, matching June 26th functionality when emails were working
- July 2, 2025: Admin dashboard implemented with comprehensive analytics
  - Added admin-only analytics dashboard accessible at /admin route
  - Restricted access to info@australianjumping.com.au email only
  - Implemented backend analytics endpoints: /api/admin/analytics, /api/admin/users, /api/admin/revenue
  - Dashboard includes user metrics, horse statistics, revenue tracking, and engagement analytics
  - Real-time data visualization with breakdown by discipline, country, subscription plans
  - Added admin middleware for secure access control and unauthorized request handling
- June 30, 2025: Video display issue fixed across all sections
  - CRITICAL FIX: Updated HorseGrid component to use MediaCarousel instead of simple Image component
  - Fixed horse-detail.tsx to include videos prop in MediaCarousel component  
  - Videos now display correctly in filter page horse cards and horse detail pages
  - Consistent video/photo display across all sections: My Horses, Filter page, and Detail pages
  - Complete media carousel functionality verified in all horse browsing areas
- June 30, 2025: Video uploads fixed and fully functional
  - CRITICAL FIX: Fixed multer configuration from memory storage to disk storage for proper file handling
  - Added static file serving for uploads directory (/uploads route)
  - Enhanced upload endpoint with detailed logging and error handling
  - Fixed file path handling for cross-platform compatibility (Windows/Linux)
  - Video files now upload properly and are accessible via URL paths
  - File size limit maintained at 25MB for both images and videos
  - Complete video upload workflow tested and verified
- June 30, 2025: Messages display issue completely resolved
  - CRITICAL FIX: Fixed token authentication key mismatch preventing messages from displaying
  - Changed localStorage key from 'auth_token' to 'authToken' for consistency across the application
  - Fixed message blinking issue during real-time updates with proper query configuration
  - Added improved loading states and error handling for better user experience
  - Messages now display correctly with smooth real-time updates every 2 seconds
  - Complete messaging flow verified: conversation selection → message display → real-time updates → message sending
- June 26, 2025: Bloodline search feature fully implemented and operational
  - Added sire and dam sire text fields to FilterPanel for direct horse browsing
  - Implemented backend filtering logic with case-insensitive partial matching for bloodlines
  - Fixed frontend parameter passing to include bloodline filters in API requests
  - Fixed backend route parsing to properly handle sire and dam_sire query parameters
  - Complete bloodline filtering now works across both saved searches and direct filtering
  - Users can search for horses by entering partial or complete bloodline names
- June 26, 2025: Authentication and subscription system fully operational
  - CRITICAL FIX: Resolved token key inconsistency that was causing logout behavior after login
  - Fixed authentication token storage mismatch between login/registration and auth verification
  - Updated all authentication functions to use consistent 'authToken' localStorage key
  - Subscription endpoints properly configured with token-based authentication middleware
  - Beta subscription activation now working correctly without authentication errors
  - Complete flow verified: login → subscription page → beta activation → application access
- June 26, 2025: Authentication system completely fixed and secured
  - CRITICAL FIX: Implemented bcrypt password hashing for security (was plain text)
  - CRITICAL FIX: Fixed login authentication - users can now access accounts
  - Fixed frontend verification page to handle both query parameters and path parameters
  - Verified complete flow: registration → email verification → login → app access
  - Password security: New registrations use bcrypt, legacy users supported during transition
  - Email verification system fully operational with custom ProHorseMatch branding
- June 26, 2025: Email verification system fully operational with Resend.com
  - Email verification debugging completed - system working correctly
  - Registration sends verification emails successfully via Resend
  - Verification links properly update database and activate accounts
  - Login requires email verification (except test users with @example.com)
  - Welcome emails sent automatically after successful verification
  - Complete flow tested: registration → email delivery → link click → database update → login access
  - Email templates updated with ProHorseMatch branding: #2b2b2b header, professional typography, and brand-consistent styling
- June 26, 2025: Email verification system migrated from Campaign Monitor to Resend.com
  - Switched email service provider to Resend for better deliverability and developer experience
  - Updated email service with Resend SDK integration
  - Professional HTML email templates maintained for verification and welcome emails
  - System now uses RESEND_API_KEY environment variable for authentication
- June 26, 2025: Complete email verification system implemented
  - Added database schema for email verification (email_verified, verification_token, verification_token_expires columns)
  - Added verification routes (/api/auth/verify-email, /api/auth/resend-verification)
  - Updated registration process to send verification emails automatically
  - Modified login to require email verification before access
  - Added frontend verification page (/verify-email) with token handling and resend functionality
- June 25, 2025: Fixed spacing gap between horse name and currency fields for more compact layout
- June 25, 2025: Completed bottom navigation migration - moved all previous/next buttons to unified bottom section across all add horse pages for improved UX flow
- June 25, 2025: Reduced vertical spacing between form fields across all add horse pages for better screen utilization
- June 25, 2025: Responsive tab improvements across all add horse pages - mobile-friendly navigation with shortened labels and next/previous buttons
- June 25, 2025: Mobile developer investigation - APK analysis revealed empty app shell with no web content
- June 25, 2025: Decision to focus on web app development while seeking reliable mobile developer
- June 25, 2025: Username system implemented across messaging
- June 25, 2025: Mobile app package created with Capacitor integration  
- June 24, 2025: Initial setup

## Current Status

**Web Application**: Production-ready with all core features functional
- Username messaging system working
- Multi-currency support (USD, AUD, EUR, GBP, NZD)
- Horse browsing, filtering, and favorites
- Stripe payments integration
- Complete mobile package available for future developer

**Mobile Development**: Seeking new developer after current one delivered empty APK shell

## User Preferences

Preferred communication style: Simple, everyday language.
Focus on web app development until reliable mobile developer found.