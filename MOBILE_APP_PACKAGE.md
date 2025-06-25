# ProHorseMatch - Mobile App Development Package

## Overview
This package contains all the files needed to develop the ProHorseMatch mobile applications for iOS and Android using Capacitor.

## App Details
- **App Name**: ProHorseMatch
- **App ID**: com.prohorsematch.app
- **Platform**: Ionic Capacitor (React + TypeScript)
- **Target Platforms**: iOS, Android

## Project Structure

### Core Files
```
ProHorseMatch/
├── android/                    # Android native project
├── ios/                       # iOS native project
├── dist/                      # Built web assets
├── client/                    # React frontend source
├── server/                    # Express backend source
├── shared/                    # Shared types and schemas
├── capacitor.config.ts        # Capacitor configuration
├── package.json              # Dependencies and scripts
└── vite.config.ts            # Build configuration
```

### Key Configuration Files
- `capacitor.config.ts` - Main Capacitor configuration
- `package.json` - Project dependencies and build scripts
- `vite.config.ts` - Frontend build configuration
- `tailwind.config.ts` - Styling configuration

## Mobile App Features

### Core Functionality
1. **User Authentication**
   - Registration for searchers and sellers
   - Session-based authentication
   - Username system with unique constraints

2. **Horse Discovery**
   - Tinder-style swipe interface
   - Advanced filtering (discipline, breed, age, price, location)
   - Multi-currency support (USD, AUD, EUR, GBP, NZD)
   - Favorites system

3. **Messaging System**
   - Real-time conversations between buyers and sellers
   - Username display with "@" format
   - Message history and read status

4. **Profile Management**
   - Dual roles (searching/selling)
   - Business contact information
   - Preference settings

5. **Payment Integration**
   - Stripe payment processing
   - Subscription management
   - Beta subscription options

## Build Commands

### Development
```bash
npm install
npm run dev                    # Start development server
```

### Production Build
```bash
npm run build                  # Build web assets
npx cap sync                   # Sync with native projects
npx cap run android           # Run on Android
npx cap run ios               # Run on iOS
```

### Mobile Development
```bash
npx cap open android          # Open Android Studio
npx cap open ios              # Open Xcode
```

## Environment Variables Required

### Database
- `DATABASE_URL` - PostgreSQL connection string

### Session Management
- `SESSION_SECRET` - Secret key for session encryption

### Payment Processing (Optional)
- `STRIPE_SECRET_KEY` - Stripe secret key for payments
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Media Storage (Optional)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## API Endpoints

### Authentication
- `POST /api/auth/register/customer` - Register searcher
- `POST /api/auth/register/owner` - Register seller
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Horses
- `GET /api/horses` - Get horses with filters
- `GET /api/horses/:id` - Get specific horse
- `POST /api/horses` - Create horse (sellers only)
- `PUT /api/horses/:id` - Update horse (sellers only)
- `DELETE /api/horses/:id` - Delete horse (sellers only)

### Messaging
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/:customerId/:ownerId/:horseId/messages` - Get messages
- `POST /api/messages` - Send message
- `POST /api/conversations` - Create conversation

### Matches/Favorites
- `POST /api/matches` - Create match/favorite
- `GET /api/matches/by-role` - Get user matches

## Mobile-Specific Considerations

### Network Configuration
- The app uses token-based authentication for mobile
- API calls include `Authorization: Bearer <token>` headers
- Base URL should be configured for production backend

### Offline Support
- Basic caching implemented via React Query
- Images cached through Capacitor
- Consider implementing offline horse browsing

### Push Notifications
- Ready for implementation with Capacitor Push Notifications plugin
- Messaging system supports real-time updates

### Camera Integration
- Photo upload functionality ready for mobile camera
- Capacitor Camera plugin can be integrated

## Database Schema

### Users Table
- Unified user model supporting both searchers and sellers
- Username field with unique constraint
- Role-based permissions (is_searching, is_selling)
- Location and preference filters

### Horses Table
- Comprehensive horse attributes
- Multi-currency pricing
- Photo and video storage URLs
- Location and breed information

### Messages/Conversations Tables
- Thread-based messaging system
- Read status tracking
- Real-time message updates

## Styling and UI

### Design System
- Tailwind CSS with custom horse industry color scheme
- Radix UI components for accessibility
- Responsive design optimized for mobile
- Custom fonts: Inter, Playfair Display, Montserrat

### Mobile Optimizations
- Touch-friendly swipe gestures
- Mobile-first responsive design
- Optimized image loading
- Touch-based navigation

## Development Notes

### Backend Compatibility
- Server configured to bind to 0.0.0.0 for mobile access
- CORS configured for mobile app domain
- Session management compatible with mobile tokens

### State Management
- React Query for server state
- Local state for UI interactions
- Context providers for global state (currency, auth)

### Testing
- All components tested with mobile viewport
- API endpoints tested with mobile authentication flow
- Cross-platform compatibility verified

## Next Steps for Mobile Developer

1. **Environment Setup**
   - Install Android Studio and Xcode
   - Configure development certificates
   - Set up physical device testing

2. **Backend Configuration**
   - Deploy backend to production server
   - Configure environment variables
   - Set up database with proper schema

3. **Mobile Customization**
   - Configure app icons and splash screens
   - Set up push notifications
   - Implement device-specific features

4. **App Store Preparation**
   - Configure app metadata
   - Prepare screenshots and descriptions
   - Set up distribution certificates

## Contact Information
- App Name: ProHorseMatch
- Package ID: com.prohorsematch.app
- Version: 1.0.0
- React Version: 18.x
- Capacitor Version: Latest

## File Inventory
The package includes:
- Complete source code (client/, server/, shared/)
- Built production assets (dist/)
- Native project files (android/, ios/)
- Configuration files
- Documentation and setup guides

This package is ready for immediate mobile app development and deployment.