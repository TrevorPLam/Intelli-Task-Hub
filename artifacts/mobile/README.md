# @workspace/mobile
> AI-powered mobile personal assistant with task management, calendar, and email capabilities

Expo React Native application that serves as the primary interface for the Intelli-Task-Hub platform. Features offline-first design with real-time synchronization and AI-powered conversations.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Development](#development)
- [Architecture](#architecture)
- [Data Management](#data-management)
- [Deployment](#deployment)
- [Testing](#testing)

## Overview

### Application Structure
Four-tab mobile application built with Expo 54 and React Native:

1. **Chat Tab** - AI-powered conversations with GPT-5.2
2. **Tasks Tab** - Project and task management system
3. **Calendar Tab** - Monthly calendar with event management
4. **Email Tab** - Email client with compose and search

### Technology Stack
- **Framework**: Expo 54 with React Native 0.81.5
- **Language**: TypeScript with strict mode
- **Navigation**: Expo Router with file-based routing
- **State**: React Context + AsyncStorage for persistence
- **UI**: Custom components with Expo Symbols
- **API**: Generated React Query hooks
- **AI**: OpenAI integration via API server

## Features

### 🤖 AI Chat
- Real-time conversations with GPT-5.2
- Persistent conversation history
- Streaming responses
- Voice input support (via integration library)
- Typing indicators and read receipts

### 📋 Task Management
- Project-based organization
- Priority levels (High/Medium/Low)
- Status tracking (Todo/In Progress/Done)
- Offline persistence with sync
- Due dates and reminders

### 📅 Calendar
- Monthly calendar view
- Event creation and management
- Color-coded event categories
- All-day event support
- Integration with task due dates

### 📧 Email Client
- Inbox management
- Compose and reply functionality
- Search and filtering
- Star and delete operations
- Attachment support (planned)

## Installation

### Prerequisites
- Node.js 24+
- Expo CLI
- iOS Simulator (iOS development) or Android Emulator (Android development)
- Physical device for testing (recommended)

### Setup Commands

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
pnpm dev
```

### Environment Variables

```bash
# Required
EXPO_PUBLIC_API_URL="https://your-api-server.com"
EXPO_PUBLIC_APP_ORIGIN="https://your-app-domain.com"

# Optional (for Replit development)
REPLIT_EXPO_DEV_DOMAIN="your-replit-domain.replit.app"
REPLIT_DEV_DOMAIN="your-replit-domain.replit.app"
REPL_ID="your-repl-id"
```

### Physical Device Testing

#### iOS
```bash
# Install Expo Go app from App Store
# Scan QR code from terminal or use:
npx expo install --fix
expo install
```

#### Android
```bash
# Install Expo Go app from Google Play Store
# Enable USB debugging on device
# Run:
pnpm dev
```

## Development

### Development Server
```bash
# Start with hot reload
pnpm dev

# Start with specific platform
pnpm dev --ios
pnpm dev --android
pnpm dev --web
```

### File Structure
```
app/
├── _layout.tsx              # Root layout with navigation
├── +not-found.tsx           # 404 page
├── (tabs)/                  # Tab navigation group
│   ├── _layout.tsx          # Tab layout configuration
│   ├── index.tsx            # Chat tab
│   ├── tasks.tsx            # Task management
│   ├── calendar.tsx         # Calendar view
│   └── email.tsx            # Email client
├── constants/
│   └── colors.ts            # Color palette
├── components/
│   ├── ErrorBoundary.tsx     # Error handling
│   ├── ErrorFallback.tsx     # Error UI
│   └── KeyboardAwareScrollViewCompat.tsx
├── context/
│   └── AppContext.tsx      # Global app state
├── hooks/
│   └── useColors.ts         # Color theming
├── utils/
│   ├── network.ts           # API configuration
│   └── validation.ts       # Form validation
└── app.config.ts           # Expo configuration
```

### Development Workflow

#### Adding New Screens
1. Create new file in appropriate directory
2. Update navigation if needed
3. Add to TypeScript project references
4. Test on all target platforms

#### State Management
```typescript
// Using React Context for global state
const AppContext = createContext<{
  user: User | null;
  conversations: Conversation[];
  tasks: Task[];
  // ... other state
}>();

// Local component state with useState
const [localState, setLocalState] = useState<Type>();
```

#### API Integration
```typescript
// Using generated React Query hooks
import { useConversations, useCreateConversation } from '@workspace/api-client-react';

function ChatComponent() {
  const { data: conversations, isLoading } = useConversations();
  const createMutation = useCreateConversation();
  
  // ... component logic
}
```

### Type Safety
All components use TypeScript with strict mode:
- Interface definitions for all data structures
- Type-safe API calls via generated hooks
- PropTypes for runtime validation (development only)

## Architecture

### Navigation Structure
```
App (Root Layout)
├── Tab Navigation
│   ├── Chat (index)
│   ├── Tasks
│   ├── Calendar
│   └── Email
└── Modal/Stack Navigation
    ├── Task Details
    ├── Event Details
    ├── Compose Email
    └── Settings
```

### Data Flow
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   App Context   │    │   API Server    │
│                 │    │                 │    │                 │
│ • React Hooks   │◄──►│ • Global State  │◄──►│ • REST API      │
│ • Local State   │    │ • Persistence   │    │ • WebSocket     │
│ • Navigation    │    │ • Sync Logic    │    │ • AI Services   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AsyncStorage │    │   React Query   │    │   Database      │
│                 │    │                 │    │                 │
│ • Local Cache   │    │ • Server State  │    │ • PostgreSQL    │
│ • Offline Data  │    │ • Caching       │    │ • Conversations │
│ • User Settings │    │ • Sync Status   │    │ • Messages      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Management

### Offline-First Strategy
1. **Local Storage**: All data stored in AsyncStorage first
2. **Background Sync**: Synchronize with API when online
3. **Conflict Resolution**: Last-write-wins with timestamps
4. **Cache Invalidation**: Intelligent cache management

### Data Models

#### Conversation
```typescript
interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}
```

#### Task
```typescript
interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Event
```typescript
interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  isAllDay: boolean;
  category: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Sync Strategy
```typescript
// Background sync when app comes online
useEffect(() => {
  const subscription = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      syncLocalChanges();
      fetchRemoteChanges();
    }
  });
  
  return () => subscription.remove();
}, []);
```

## Deployment

### Development Builds

#### Expo Development Build
```bash
# Create development build
expo install --fix
eas build --profile development --platform all
```

#### Preview Builds
```bash
# Build for preview/testing
eas build --profile preview --platform all
```

### Production Deployment

#### App Store (iOS)
```bash
# Build for App Store
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios
```

#### Google Play (Android)
```bash
# Build for Google Play
eas build --profile production --platform android

# Submit to Google Play
eas submit --platform android
```

### Web Deployment
```bash
# Export for web hosting
expo export

# Deploy to hosting provider
# Upload dist/ folder to your web server
```

### Configuration Files

#### app.config.ts
```typescript
export default {
  expo: {
    name: 'Intelli Task Hub',
    slug: 'intelli-task-hub',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.yourcompany.intellitaskhub'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF'
      },
      package: 'com.yourcompany.intellitaskhub'
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro'
    },
    plugins: ['expo-router'],
    extra: {
      eas: {
        projectId: 'your-eas-project-id'
      }
    }
  }
} as const;
```

## Testing

### Unit Testing
```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### E2E Testing
```bash
# Run E2E tests with Detox (when configured)
pnpm test:e2e

# Run on specific platform
pnpm test:e2e:ios
pnpm test:e2e:android
```

### Manual Testing Checklist

#### Core Functionality
- [ ] Chat conversations work end-to-end
- [ ] Task creation and management
- [ ] Calendar event creation
- [ ] Email compose and send
- [ ] Offline functionality
- [ ] Data synchronization
- [ ] Push notifications (if configured)

#### Platform Testing
- [ ] iOS Simulator testing
- [ ] Android Emulator testing
- [ ] Physical iOS device testing
- [ ] Physical Android device testing
- [ ] Web browser testing

#### Performance Testing
- [ ] App startup time < 3 seconds
- [ ] Navigation responsiveness
- [ ] Memory usage within limits
- [ ] Battery consumption optimization

## Dependencies

### Runtime Dependencies
- `expo` - Expo SDK and CLI
- `expo-router` - File-based navigation
- `react` - React framework
- `react-native` - React Native core
- `@workspace/api-client-react` - Generated API hooks
- `@tanstack/react-query` - Server state management
- `zod` - Runtime validation

### Development Dependencies
- `@types/react` - React TypeScript definitions
- `@types/react-native` - React Native types
- `typescript` - TypeScript compiler
- `vitest` - Testing framework

## Related Packages

- **[@workspace/api-client-react](../../../lib/api-client-react/README.md)** - API integration
- **[@workspace/integrations-openai-ai-react](../../../lib/integrations-openai-ai-react/README.md)** - AI features
- **[@workspace/api-server](../api-server/README.md)** - Backend API

## Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
# Clear Metro cache
npx expo start --clear

# Reset node modules
rm -rf node_modules
pnpm install
```

#### Navigation Issues
- Ensure all screens are properly exported
- Check file naming conventions
- Verify layout configuration

#### API Connection Issues
- Verify environment variables
- Check network connectivity
- Validate API server accessibility

### Performance Optimization

#### Bundle Size
- Use dynamic imports for large components
- Optimize image assets
- Remove unused dependencies

#### Memory Usage
- Implement proper cleanup in useEffect
- Use FlatList for long lists
- Optimize re-renders with React.memo

## Support

For mobile-specific issues:
- Check [Expo Documentation](https://docs.expo.dev/)
- Review [React Native Docs](https://reactnative.dev/docs/getting-started)
- Submit [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)

## License

MIT License - see the main project [LICENSE](../../../LICENSE) file for details.
