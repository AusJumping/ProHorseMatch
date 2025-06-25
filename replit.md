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