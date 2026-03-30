# @workspace/mockup-sandbox
> Interactive component development playground with real-time preview capabilities

Vite-powered React development environment designed for rapid prototyping, component testing, and UI validation. Provides a comprehensive component library with hot module replacement and live preview functionality.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Development](#development)
- [Component Library](#component-library)
- [Mockup System](#mockup-system)
- [Deployment](#deployment)

## Overview

The Mockup Sandbox is a specialized development tool that provides:

- **Component Playground** - Interactive testing environment for UI components
- **Design System Validation** - Ensure consistency across the application
- **Performance Benchmarking** - Test component performance under various conditions
- **Responsive Design Testing** - Validate components across different screen sizes
- **Accessibility Testing** - Built-in accessibility validation tools

### Technology Stack
- **Build Tool**: Vite 8.0 with hot module replacement
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4.1 with custom design tokens
- **UI Components**: Radix UI primitives with custom theming
- **Animation**: Framer Motion for smooth interactions
- **Development**: Replit plugins for enhanced DX

## Features

### 🎨 Component Library
Comprehensive collection of pre-built components:

- **Form Components** - Input, select, checkbox, radio, switch
- **Layout Components** - Grid, flex, container, spacer
- **Navigation Components** - Tabs, breadcrumbs, pagination
- **Feedback Components** - Alert, toast, loading, progress
- **Data Display** - Table, card, badge, avatar
- **Overlay Components** - Modal, drawer, popover, tooltip

### 🔧 Development Tools
- **Hot Module Replacement** - Instant updates during development
- **Component Isolation** - Test components in isolation
- **Props Playground** - Interactive prop manipulation
- **Storybook-like Interface** - Organized component documentation
- **Performance Monitoring** - Real-time performance metrics

### 🎯 Mockup System
Specialized mockup generation for UI design:

- **Button Mockups** - Various button styles and states
- **Form Mockups** - Complete form layouts
- **Navigation Mockups** - Menu and navigation patterns
- **Content Mockups** - Text, image, and media layouts
- **Interactive Mockups** - Clickable prototypes

## Installation

### Prerequisites
- Node.js 24+
- pnpm package manager
- Modern web browser with ES2022 support

### Setup Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Environment Variables

```bash
# Development configuration
VITE_DEV_SERVER_PORT=5173
VITE_HMR_PORT=24678

# Feature flags
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ACCESSIBILITY_VALIDATION=true
VITE_ENABLE_RESPONSIVE_TESTING=true
```

## Development

### Development Server
```bash
# Start with default configuration
pnpm dev

# Start with custom port
pnpm dev --port 3000

# Start with HTTPS
pnpm dev --https

# Start with specific host
pnpm dev --host 0.0.0.0
```

### File Structure
```
src/
├── App.tsx                    # Main application entry
├── components/
│   ├── ui/                   # Base UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ... (50+ components)
│   └── mockups/              # Mockup components
│       └── Button.mockup.tsx
├── hooks/
│   └── use-toast.ts          # Custom React hooks
├── lib/
│   └── utils.ts              # Utility functions
└── main.tsx                 # React entry point
```

### Component Development

#### Creating New Components
```typescript
// src/components/ui/NewComponent.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface NewComponentProps {
  className?: string;
  children: React.ReactNode;
  // ... other props
}

const NewComponent = forwardRef<HTMLDivElement, NewComponentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('base-styles', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NewComponent.displayName = 'NewComponent';
export { NewComponent };
```

#### Component Documentation
```typescript
/**
 * Component description and usage examples.
 * 
 * @example
 * ```tsx
 * <NewComponent className="custom-class">
 *   Content here
 * </NewComponent>
 * ```
 */
```

### Styling System

#### Tailwind Configuration
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... custom color palette
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

#### CSS Custom Properties
```css
/* src/index.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
  --font-sans: 'Inter', system-ui;
  --font-mono: 'JetBrains Mono', monospace;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
}
```

## Component Library

### Available Components

#### Form Components
- **Button** - Clickable action buttons with variants
- **Input** - Text input with validation states
- **Select** - Dropdown selection component
- **Checkbox** - Toggle selection component
- **Radio** - Single selection component
- **Switch** - On/off toggle component
- **Textarea** - Multi-line text input
- **Form** - Form validation and submission

#### Layout Components
- **Card** - Container component with header/body/footer
- **Grid** - CSS Grid layout system
- **Flex** - Flexbox layout utilities
- **Container** - Responsive container
- **Separator** - Visual divider component
- **Spacer** - Spacing utility component

#### Navigation Components
- **Tabs** - Tab navigation system
- **Breadcrumb** - Navigation breadcrumb trail
- **Pagination** - Page navigation component
- **Menu** - Dropdown menu component
- **Navigation Menu** - Multi-level navigation

#### Feedback Components
- **Alert** - Informational message component
- **Toast** - Notification system
- **Progress** - Progress indicators
- **Loading** - Loading states
- **Badge** - Status indicators

#### Data Display
- **Table** - Data table with sorting/filtering
- **Avatar** - User avatar component
- **Calendar** - Date picker component
- **Chart** - Data visualization components
- **Carousel** - Image/content carousel

#### Overlay Components
- **Dialog** - Modal dialog component
- **Drawer** - Slide-out panel
- **Popover** - Floating content container
- **Tooltip** - Contextual help text
- **Dropdown Menu** - Action menu component

### Component Usage Examples

#### Button Component
```tsx
import { Button } from '@/components/ui/button';

function Example() {
  return (
    <div className="flex gap-2">
      <Button variant="default">Default Button</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}
```

#### Form Component
```tsx
import { Input, Label, Form } from '@/components/ui';

function ContactForm() {
  return (
    <Form className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Enter your name" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="Enter your email" />
      </div>
      <Button type="submit">Submit</Button>
    </Form>
  );
}
```

## Mockup System

### Mockup Categories

#### Button Mockups
Various button styles and interactive states:
- Primary/Secondary/Tertiary buttons
- Different sizes and variants
- Loading and disabled states
- Icon buttons and button groups

#### Form Mockups
Complete form layouts and patterns:
- Login/Registration forms
- Contact and feedback forms
- Search and filter forms
- Multi-step wizards

#### Navigation Mockups
Common navigation patterns:
- Header navigation bars
- Sidebar navigation
- Tab navigation
- Breadcrumb trails

#### Content Mockups
Content layout and presentation:
- Article/blog layouts
- Product cards and grids
- Image galleries
- Data tables and lists

### Creating Custom Mockups

```typescript
// src/components/mockups/CustomMockup.tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function CustomMockup() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Custom Mockup</h3>
      <div className="space-y-4">
        <Button>Interactive Element</Button>
        {/* Add more components as needed */}
      </div>
    </Card>
  );
}
```

### Mockup Preview Plugin
The mockup preview plugin provides:
- Real-time component preview
- Interactive prop manipulation
- Code generation from mockups
- Export functionality for designs

## Deployment

### Production Build
```bash
# Build optimized production bundle
pnpm build

# Preview production build locally
pnpm preview

# Analyze bundle size
pnpm build --analyze
```

### Static Hosting

#### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod
```

#### Netlify Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

#### GitHub Pages
```bash
# Build for GitHub Pages
pnpm build

# Deploy to gh-pages
gh-pages -d dist
```

### Docker Deployment
```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Performance Optimization

### Bundle Analysis
```bash
# Analyze bundle size
pnpm build --analyze

# Check for unused dependencies
pnpm knip

# Lint for performance issues
pnpm lint --performance
```

### Component Performance
- **Lazy Loading** - Components loaded on demand
- **Code Splitting** - Automatic route-based splitting
- **Tree Shaking** - Unused code elimination
- **Asset Optimization** - Image and font optimization

### Development Performance
- **Fast Refresh** - Sub-second hot reload
- **Type Checking** - Incremental TypeScript compilation
- **Source Maps** - Debug-friendly builds
- **Error Overlay** - Rich error reporting

## Dependencies

### Runtime Dependencies
- `react` - React framework
- `react-dom` - React DOM renderer
- `@radix-ui/*` - Accessible component primitives
- `framer-motion` - Animation library
- `lucide-react` - Icon library
- `tailwindcss` - CSS framework
- `class-variance-authority` - Component variant management
- `clsx` - Conditional class names
- `cmdk` - Command palette functionality

### Development Dependencies
- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - React plugin for Vite
- `@replit/vite-plugin-*` - Replit-specific plugins
- `typescript` - TypeScript compiler
- `vitest` - Testing framework

## Related Packages

- **[@workspace/api-client-react](../../../lib/api-client-react/README.md)** - API integration components
- **[@workspace/mobile](../mobile/README.md)** - Mobile application components

## Troubleshooting

### Common Issues

#### HMR Not Working
```bash
# Clear Vite cache
rm -rf .vite
pnpm dev
```

#### Component Not Found
- Check import paths
- Verify component exports
- Ensure file extensions

#### Styling Issues
- Verify Tailwind CSS imports
- Check CSS custom properties
- Validate class names

### Performance Issues

#### Slow Development Server
- Increase available memory
- Check for large dependencies
- Optimize file watching

#### Large Bundle Size
- Analyze bundle with `--analyze`
- Remove unused dependencies
- Implement code splitting

## Support

For component library issues:
- Check [Radix UI Documentation](https://www.radix-ui.com/)
- Review [Tailwind CSS Docs](https://tailwindcss.com/docs)
- Submit [GitHub Issues](https://github.com/TrevorPLam/Intelli-Task-Hub/issues)

## License

MIT License - see the main project [LICENSE](../../../LICENSE) file for details.
