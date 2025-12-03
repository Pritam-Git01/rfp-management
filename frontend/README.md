# RFP Management System - Frontend

A modern Next.js 15 frontend application for the AI-Powered RFP Management System with ShadCN UI components and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 15.0.3 (App Router)
- **Language**: JavaScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **State Management**: Zustand
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Date Formatting**: date-fns
- **Form Handling**: React Hook Form + Zod

## Features

✅ **Authentication**
- Simple signup/login with JWT
- Protected routes
- Persistent auth state with Zustand

✅ **Dashboard**
- Overview statistics
- Recent RFPs display
- Quick actions

✅ **RFP Management**
- Natural language RFP creation with AI
- Chat-like interface
- Real-time structured data preview
- Edit mode for structured data
- List and search RFPs
- Delete RFPs

✅ **RFP Details**
- Comprehensive detail view
- Vendor selection
- Send RFPs via email
- View proposals
- Tabbed interface

✅ **Proposal Management**
- View received proposals
- Automatic AI parsing display
- Proposal status tracking

✅ **AI-Powered Comparison**
- Side-by-side proposal comparison
- AI recommendations
- Summary statistics
- Visual indicators
- Detailed analysis

✅ **Vendor Management**
- Browse all vendors
- Search and filter
- View vendor details

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- Backend API running (see backend README)

## Installation

### 1. Extract and Install

```bash
# Extract the frontend archive
tar -xzf rfp-frontend.tar.gz
cd rfp-frontend

# Install dependencies
npm install
```

### 2. Install ShadCN UI Components

Run the following command to add all required ShadCN UI components:

```bash
npx shadcn-ui@latest add button card input label textarea badge tabs checkbox toaster toast use-toast
```

This will install:
- `button` - Buttons
- `card` - Card components
- `input` - Input fields
- `label` - Form labels
- `textarea` - Text areas
- `badge` - Badges
- `tabs` - Tabbed interface
- `checkbox` - Checkboxes
- `toaster` - Toast notifications
- `toast` - Toast component
- `use-toast` - Toast hook

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
rfp-frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/           # Login page
│   │   │   └── signup/          # Signup page
│   │   ├── dashboard/
│   │   │   ├── layout.js        # Dashboard layout
│   │   │   ├── page.js          # Dashboard home
│   │   │   ├── rfps/
│   │   │   │   ├── page.js      # RFPs list
│   │   │   │   ├── create/      # Create RFP
│   │   │   │   └── [id]/
│   │   │   │       ├── page.js  # RFP detail
│   │   │   │       └── compare/ # Compare proposals
│   │   │   └── vendors/
│   │   │       └── page.js      # Vendors list
│   │   ├── layout.js            # Root layout
│   │   ├── page.js              # Landing page
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.js
│   │   ├── layout/
│   │   │   └── Sidebar.js
│   │   └── ui/                  # ShadCN UI components
│   ├── lib/
│   │   ├── axios.js             # Axios instance
│   │   └── utils.js             # Utility functions
│   └── store/
│       └── authStore.js         # Zustand auth store
├── public/
├── package.json
├── tailwind.config.js
├── next.config.js
├── components.json              # ShadCN config
└── README.md
```

## Key Features Explained

### 1. Axios Interceptors
Centralized API calls with automatic token injection and 401 handling:
```javascript
// src/lib/axios.js
- Automatically adds Bearer token to requests
- Redirects to login on 401 errors
- Centralized error handling
```

### 2. Zustand State Management
Global auth state management:
```javascript
// src/store/authStore.js
- Persistent auth state
- localStorage integration
- Simple API (setAuth, logout, initAuth)
```

### 3. Protected Routes
Automatic auth check and redirect:
```javascript
// src/components/auth/ProtectedRoute.js
- Checks localStorage for token
- Redirects to login if not authenticated
- Shows loading state
```

### 4. CSS Variables
All colors defined in CSS variables for easy theming:
```css
/* src/app/globals.css */
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  /* ... */
}
```

### 5. Responsive Design
- Mobile-first approach
- Tailwind responsive utilities
- Collapsible sidebar (future enhancement)

## User Flow

### 1. Authentication
```
Landing Page → Check Auth → Login/Signup → Dashboard
```

### 2. Create RFP
```
Dashboard → Create RFP → Enter Description → AI Processing → 
Review Structured Data → Edit (optional) → Save
```

### 3. Send RFP
```
RFP Detail → Select Vendors → Send RFP → Email Sent
```

### 4. View Proposals
```
RFP Detail → Proposals Tab → View Parsed Data → AI Analysis
```

### 5. Compare Proposals
```
RFP Detail → Compare Button → AI Comparison → 
View Recommendations → Summary Stats → Detailed Comparison
```

## API Integration

All API calls go through the axios instance in `src/lib/axios.js`:

### Authentication
```javascript
POST /auth/signup
POST /auth/login
GET /auth/profile
```

### RFPs
```javascript
GET /rfps
POST /rfps
GET /rfps/:id
PATCH /rfps/:id
DELETE /rfps/:id
POST /rfps/:id/send
```

### Vendors
```javascript
GET /vendors
GET /vendors/:id
```

### Proposals
```javascript
GET /proposals/rfp/:rfpId
GET /proposals/rfp/:rfpId/compare
GET /proposals/:id
```

## Styling Guide

### Color System
All colors use CSS variables defined in `globals.css`:
- `--primary` - Primary brand color
- `--secondary` - Secondary color
- `--muted` - Muted backgrounds
- `--destructive` - Error/danger states
- `--border` - Border colors

### Component Variants
ShadCN components support multiple variants:
```jsx
<Button variant="default" /> // Primary
<Button variant="outline" /> // Outlined
<Button variant="ghost" />   // Ghost
<Badge variant="default" />  // Default badge
<Badge variant="secondary" /> // Secondary badge
```

### Spacing
Consistent spacing using Tailwind utilities:
- `space-y-4` - Vertical spacing
- `gap-4` - Grid/flex gaps
- `p-4` - Padding
- `m-4` - Margin

## Best Practices Implemented

### 1. Component Organization
- Separation of concerns
- Reusable components
- Clear folder structure

### 2. State Management
- Zustand for global state (auth)
- React state for local component state
- No prop drilling

### 3. API Calls
- Centralized axios instance
- Automatic token handling
- Error handling
- Loading states

### 4. Error Handling
- Toast notifications for errors
- Loading spinners
- Empty states
- Error boundaries (future)

### 5. Performance
- Client components only where needed
- Optimized re-renders
- Lazy loading (future enhancement)

### 6. Code Quality
- Consistent naming conventions
- Clean code structure
- Minimal comments (self-documenting)
- Function-based approach

## Scalability Considerations

### Current Architecture
- Modular component structure
- Centralized API layer
- State management ready
- Easy to add new features

### Future Enhancements
1. **Add React Query/SWR**
   - Better caching
   - Automatic refetching
   - Optimistic updates

2. **Add Route Loading States**
   - Suspense boundaries
   - Skeleton loaders

3. **Add Error Boundaries**
   - Graceful error handling
   - Error reporting

4. **Add Dark Mode**
   - Toggle dark/light theme
   - CSS variables already support it

5. **Add Internationalization (i18n)**
   - Multi-language support
   - next-intl integration

6. **Add Analytics**
   - Track user actions
   - Monitor performance

7. **Add Testing**
   - Jest + React Testing Library
   - E2E with Playwright

## Common Issues & Solutions

### Issue: Components not found
**Solution**: Run the ShadCN installation command:
```bash
npx shadcn-ui@latest add button card input label textarea badge tabs checkbox toaster toast use-toast
```

### Issue: API calls failing
**Solution**: 
1. Check backend is running on port 5000
2. Verify NEXT_PUBLIC_API_URL in .env
3. Check browser console for errors

### Issue: Authentication not persisting
**Solution**:
1. Check localStorage in browser DevTools
2. Verify token is being set in authStore
3. Check axios interceptor is adding token

### Issue: Styles not applying
**Solution**:
1. Restart dev server
2. Check Tailwind config
3. Verify CSS variables in globals.css

## Development Tips

### 1. Hot Reload
Next.js supports hot module replacement. Changes will reflect immediately.

### 2. Component Development
Test components in isolation before integrating.

### 3. API Testing
Use browser DevTools Network tab to debug API calls.

### 4. State Debugging
Install Zustand DevTools for state inspection:
```bash
npm install @redux-devtools/extension
```

### 5. Responsive Testing
Use browser DevTools device toolbar to test responsive design.

## Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

The build will:
- Optimize for production
- Minify code
- Generate static pages where possible
- Create optimized bundles

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000/api` |

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow existing code style
2. Use ShadCN UI components
3. Test on multiple screen sizes
4. Update README if needed

## License

MIT

## Support

For issues or questions, refer to:
- Backend README for API documentation
- ShadCN UI docs: https://ui.shadcn.com
- Next.js docs: https://nextjs.org/docs
- Tailwind CSS docs: https://tailwindcss.com/docs

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Environment Setup for Production
Ensure `NEXT_PUBLIC_API_URL` points to your production backend URL.

---

**Happy Coding! 🚀**
