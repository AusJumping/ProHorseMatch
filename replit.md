# ProHorseMatch

## Overview
ProHorseMatch is a Tinder-style matching application designed to connect professional riders with performance horses for sale. It leverages smart technology for horse-buyer matching, offering features like swipe-based browsing, advanced filtering, and direct communication between users. The platform aims to streamline the horse purchasing process, providing a specialized marketplace for high-value equine transactions.

## User Preferences
Preferred communication style: Simple, everyday language.
Focus on web app development until reliable mobile developer found.

## Recent Changes (August 19, 2025)
- **RESOLVED**: Fixed critical authentication mismatch in upload system
- Removed authentication requirement from local upload fallback endpoint (`/api/upload`)
- Enhanced error handling to show specific response codes and error messages
- Upload system now works perfectly with Cloudinary primary and local storage fallback
- Both photo and video uploads verified working in development
- **STATUS**: Ready for deployment - upload system fully functional and tested

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