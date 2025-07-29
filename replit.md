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

- July 29, 2025: Password reset system completely operational and verified working
  - FIXED: JSX syntax errors in auth component that were preventing form rendering
  - VERIFIED: Complete password reset flow working end-to-end with API testing
  - CONFIRMED: Forgot password emails sent successfully via Resend service
  - TESTED: Password reset tokens processed correctly and passwords updated in database
  - VALIDATED: Login functionality working with newly reset passwords
  - ENHANCED: Password visibility toggles (eyeball icons) functional on reset form
  - COMPLETE: Full password reset workflow: forgot password → email → reset form → login with new password
- July 22, 2025: Password reset functionality fixed and Di Bressington account removed
  - FIXED: Password reset email URLs now use correct 'token' parameter instead of 'reset_token'
  - RESOLVED: Reset password button in emails now properly redirects to password reset form
  - VERIFIED: Complete password reset flow working: forgot password → email → reset form → new password
  - REMOVED: Di Bressington account (bressington2107@bigpond.com) and all associated data cleaned up
  - TESTED: Password reset system fully operational with proper token handling and form display
- July 22, 2025: Email verification system restored and operational
  - FIXED: Email service configuration now prioritizes Resend over SendGrid for reliable delivery
  - RESOLVED: ES module import issue that was preventing email service initialization
  - VERIFIED: Email verification system now working end-to-end with successful delivery to real email addresses
  - CONFIRMED: Server logs show successful email dispatch via Resend with proper response IDs
  - TESTED: Both bressington2107@bigpond.com and david@australianjumping.com.au receiving verification emails
- July 21, 2025: Terms of Service updated with comprehensive liability disclaimer and subscription terms
  - UPDATED: Complete Terms of Service content in subscription page with enhanced legal protection
  - ENHANCED: Content accuracy section clarifying user responsibility for all listing information
  - STRENGTHENED: Liability limitation language regarding horse condition, health, and suitability
  - CLARIFIED: Subscription billing, auto-renewal, cancellation, and beta trial policies
  - IMPROVED: Legal framework protecting platform while emphasizing buyer/seller due diligence responsibility
- July 21, 2025: Mobile horse detail page layout completely fixed and optimized
  - RESOLVED: Mobile overflow issue that was pushing content off the right side of screen
  - FIXED: Hamburger menu positioning on mobile - now properly aligned and fully visible
  - UPDATED: Horse detail card layout with full-width pedigree box and separate location box underneath
  - ENHANCED: Consistent text sizing between desktop and mobile for all detail sections
  - APPLIED: Layout component mobile constraints with overflow-x-hidden and proper width management
  - OPTIMIZED: Simplified container structure removing complex viewport calculations
  - ENHANCED: Mobile favorite button optimized - removed text, kept only heart icon for space efficiency
  - VERIFIED: Perfect fit confirmed by user - mobile navigation and content now display correctly
  - COMPLETE: End-to-end mobile horse detail experience with proper content positioning and navigation accessibility
- July 21, 2025: Horse detail page terminology and pedigree display enhanced
  - UPDATED: "Discipline" heading changed to "Primary Discipline" in horse detail stats grid for clarity
  - UPDATED: "Breeding" heading changed to "Pedigree" in horse detail stats grid for professional terminology
  - RESTRUCTURED: Pedigree section now displays lineage in three separate labeled rows (Sire:, Dam:, Dam Sire:) instead of single concatenated format
  - ENHANCED: Improved readability and professional presentation of horse genealogy information in detail view
- July 21, 2025: Enhanced horse age and height display terminology
  - UPDATED: All horse display components now show "Yearling" instead of "1 yrs" for 1-year-old horses
  - UPDATED: Height display now shows "Height TBD" instead of "hh" when height_hands is null or "young_horse"
  - APPLIED: Consistent terminology across HorseCard, HorseGrid, horse detail page, favorites page, and admin dashboard
  - ENHANCED: Better equestrian terminology with "Height TBD" for horses without established height measurements
  - COMPLETE: All horse listing views now use clear, professional terms for young horses and pending height determinations
- July 21, 2025: Horse card lineage display updated for better readability
  - UPDATED: Horse summary cards now display lineage information in three separate rows (Sire, Dam, Dam Sire) instead of single concatenated line
  - APPLIED: Consistent layout changes to both HorseCard and HorseGrid components for uniform appearance
  - ENHANCED: Optimized spacing between lineage rows using space-y-0.5 for compact, readable display
  - IMPROVED: Desktop horse card layout provides clearer pedigree information for better horse evaluation
- July 21, 2025: Mobile horse navigation system fully fixed and operational
  - RESOLVED: Mobile navigation buttons (Previous/Next) now work correctly for browsing horses
  - FIXED: Horse counter display now updates properly showing current position (e.g., "horse 2 of 2")
  - FIXED: Navigation state management issue where horses query was re-running on each button click
  - ENHANCED: Converted arrow icon navigation to gold-colored buttons with "Previous"/"Next" text for better mobile UX
  - STABILIZED: Query management to prevent unnecessary re-fetching while preserving proper navigation tracking
  - COMPLETE: End-to-end mobile horse browsing experience with working navigation and accurate position display
- July 21, 2025: Horse deletion questionnaire feature fully implemented and operational
  - ADDED: Comprehensive 3-question deletion modal asking users about horse sale status (sold through app, sold elsewhere, unsold)
  - ADDED: Backend API endpoints for collecting and storing deletion response data with analytics
  - ADDED: "Deletions" tab in admin dashboard with detailed analytics, percentage breakdowns, and monthly trends
  - ENHANCED: Horse deletion process now requires users to select at least one questionnaire option before deletion
  - ENHANCED: Admin dashboard displays real-time deletion analytics with response categorization and historical data
  - COMPLETE: Full-stack questionnaire system from frontend modal to backend analytics with proper validation
  - User feedback: "works well" - feature confirmed operational and ready for production use
- July 20, 2025: Authentication system fixed for production deployment stability
  - CRITICAL FIX: Implemented stateless token validation that doesn't rely on global in-memory storage
  - Extended authentication token expiration from 1 hour to 24 hours for better user experience
  - Fixed token decoding issues with URL-encoded cookies using decodeURIComponent
  - Resolved production authentication failures caused by server restarts clearing token store
  - Authentication now works reliably on deployed site without requiring frequent re-login
  - Complete system tested: login → token creation → stateless validation → protected endpoint access
- July 14, 2025: Admin horse management system completed with crash prevention
  - ADDED: Admin backend routes for horse management (/api/admin/horses)
  - ADDED: Admin-only GET, PUT, DELETE endpoints for managing all horses
  - ADDED: "Horses" tab in admin dashboard with comprehensive horse management interface
  - ADDED: Horse listing view with details (ID, owner, disciplines, age, sex, price, location)
  - ADDED: View and Delete buttons for each horse with confirmation dialogs
  - FIXED: Horse deletion crash by implementing proper foreign key relationship handling
  - FIXED: Horse view navigation from /horses/${id} to correct /horse/${id} route
  - ENHANCED: Delete horse functionality now safely removes all related matches, messages, and conversations
  - ENHANCED: Comprehensive error handling and logging for admin operations
  - RESTRICTED: All horse management features available only to info@australianjumping.com.au
  - COMPLETE: Full admin horse management system operational with crash prevention and proper authorization
- July 14, 2025: Mobile navigation and filter display fixed completely
  - FIXED: Mobile menu "Find Horses" navigation now works correctly without timeout delays
  - FIXED: Filter panel now displays properly on mobile when accessing /filter route
  - Updated mobile navbar to navigate directly to /filter instead of using problematic setTimeout
  - Updated filter display logic to show filters on mobile for both /filter and /discover routes
  - Ensured consistent navigation behavior between desktop sidebar and mobile menu
  - Complete mobile user experience: navigation → filter page → visible filters → horse browsing
- July 14, 2025: Enhanced mobile UX flow with horses-first browsing experience
  - CHANGED: Welcome page "Get Started" behavior to show horse listings immediately rather than filter details
  - Mobile users now see horses by default on /filter route with filters accessible via toggle
  - Desktop users continue to see filters by default for power-user experience
  - Implemented mobile-first browsing experience: horses display immediately, filters optional
  - FIXED: Mobile filter button now correctly toggles filter visibility using showFilter state
  - Mobile filter access fully functional: tap "Filters" button to show/hide filter panel
- July 14, 2025: Horse detail page layout improved for better user experience
  - CHANGED: Horse detail page layout from side-by-side to vertical stack design
  - Image/media carousel now displays above text content instead of beside it
  - Improved mobile and desktop viewing with single responsive layout
  - Media gallery height increased to 50vh for better image visibility
  - Fixed horse creation authentication bug by adding Authorization header to frontend requests
- July 14, 2025: Sex options enhanced with "Colt" and "Filly" choices
  - ADDED: "Colt" and "Filly" options to the top of all sex selection dropdowns
  - Updated Add Horse form gender selection to include new options
  - Updated Edit Horse form gender selection to include new options  
  - Updated Filter Panel sex dropdown to include new options
  - Provides better categorization for young horses under 4 years old
- July 14, 2025: Level options enhanced with "Not Applicable" and "Young Horse" choices
  - ADDED: "Not Applicable" and "Young Horse" options to the top of all level selection dropdowns
  - Updated Add Horse form level selection to include new options
  - Updated Edit Horse form level selection to include new options
  - Updated Filter Panel level dropdown to include new options
  - Provides better categorization for horses that don't fit traditional competition levels
- July 14, 2025: Height range updated to remove smaller heights (12.0-13.3hh)
  - REMOVED: All height options between 12.0hh and 13.3hh from Add Horse, Edit Horse, and Filter forms
  - Height dropdowns now start at 14.0hh for standard horses, with "Young Horse" option for horses under 3 years
  - Updated all three forms consistently: add-horse.tsx, edit-horse.tsx, and FilterPanel.tsx
  - Maintains "Young Horse" functionality for horses without set heights or under 3 years old
- July 14, 2025: "Young Horse" height filter fully implemented and operational
  - ADDED: "Young Horse" option to both min and max height filter dropdowns in FilterPanel.tsx
  - UPDATED: Backend routes.ts to parse "young_horse" filter parameter and set young_horse=true flag
  - IMPLEMENTED: Backend filtering logic in storage.ts for both DatabaseStorage and MemStorage classes
  - FIXED: Frontend dropdown handling to properly manage "young_horse" string value instead of converting to NaN
  - ENHANCED: Display logic to show "Young Horse" text when selected in dropdown
  - "Young Horse" filter targets horses under 3 years old OR horses with null height values
  - Complete end-to-end functionality verified from frontend selection to backend filtering
- July 10, 2025: Desktop header simplified and cleaned up
  - REMOVED: Search for horses input field from desktop header
  - REMOVED: Add Horse button from desktop header (still available in sidebar)
  - REMOVED: Notification bell icon from desktop header
  - Desktop header now shows only page title/back button and maintains clean, minimal design
- July 10, 2025: Active menu items now use gold color styling
  - COMPLETED: All sidebar navigation menu items now display gold (#cdac6e) background with white text when active
  - Updated active state detection for: Find Horses, Favorites, Messages, Saved Searches, My Horses, Add Horse, Profile, and Subscription
  - Enhanced CSS with data-active attribute styling for consistent active state appearance across all menu components
  - Consistent hover and active styling now uses the same gold color for unified brand experience
- July 10, 2025: Profile page simplified to display read-only account information
  - CHANGED: Username and email fields now display as read-only disabled inputs
  - REMOVED: Save Changes button and form submission functionality
  - Updated description from "Update your personal information" to "View your account information"
  - Added contact information for username/email changes via support@prohorsematch.com
  - Cleaned up unused form validation, schema, and component imports for better performance
- July 10, 2025: Enhanced Terms of Service with comprehensive horse listings liability disclaimer
  - ADDED: New "Horse Listings and Buyer Responsibility" section to all Terms of Service components
  - Added explicit disclaimers about platform liability regarding horse condition, health, and suitability
  - Clarified buyer responsibility for due diligence, veterinary examinations, and professional advice
  - Updated all three Terms of Service dialogs (subscription page, TermsOfServiceDialog, TermsDialog) for consistency
  - Enhanced legal protection for platform regarding horse transactions and listing accuracy
- July 10, 2025: Excel export functionality added to admin dashboard  
  - ADDED: "Export to Excel" button in Users tab of admin dashboard
  - Users can now download comprehensive user data including emails, usernames, account types, subscription details
  - Export includes all user information in organized Excel spreadsheet with proper column formatting
  - File automatically named with current date: "ProHorseMatch_Users_YYYY-MM-DD.xlsx"
  - Export disabled when no user data available with appropriate user feedback
- July 10, 2025: Profile page updated with username field
  - REMOVED: Name field from Profile page Personal Information section
  - ADDED: Username field (required) to replace optional name field 
  - Updated form schema validation to require minimum 2 characters for username
  - Profile page now displays and allows editing of username instead of name
  - Changes maintain consistency with existing user data structure (username field already exists in database)
- July 8, 2025: Auto-logout security system fully implemented with 1-hour timeout
  - Enhanced server-side token authentication with 1-hour expiration (previously 30 days)
  - Added activity tracking to `isTokenAuthenticated` middleware for session management
  - Implemented comprehensive frontend auto-logout hook (`useAutoLogout`) with inactivity detection
  - Frontend monitors user activity (clicks, scrolls, keyboard input) and triggers logout after 1 hour
  - Token cleanup on server: expired tokens automatically removed to prevent memory leaks
  - Complete security flow: login → 1-hour token → activity tracking → automatic logout → redirect to landing
  - Integration into App.tsx ensures all authenticated users are protected by auto-logout
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
  - Removed distance dropdown from location section to simplify the location filter interface
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