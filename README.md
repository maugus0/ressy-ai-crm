# RessyAI CRM Frontend

A modern customer relationship management platform frontend built with React, Vite, and Tailwind CSS. This application provides a fast and responsive user interface for managing leads, contacts, calls, and analytics.

## 🚀 Features

- **Dashboard & Analytics** - Comprehensive analytics dashboard with charts and metrics
- **Call Management** - View call transcripts, details, and history
- **Customer Database** - Manage customer information and contacts
- **Expenses Tracking** - Track and manage call expenses
- **User Authentication** - Secure login and registration system
- **Responsive Design** - Mobile-first design that works on all devices

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js) or [bun](https://bun.sh/)

## 🛠️ Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/maugus0/ressy-ai-crm.git
cd ressy-ai-crm
npm install
```

## 📜 Available NPM Commands

### Development Commands

#### `npm run dev`
Start the development server with hot module replacement (HMR).

```bash
npm run dev
```

- **Port**: `http://localhost:8080` (configured in `vite.config.ts`)
- **Features**: Hot reload, fast refresh, source maps
- **Use case**: Local development and testing

#### `npm run preview`
Preview the production build locally before deploying.

```bash
npm run preview
```

- **Port**: `http://localhost:4173` (default Vite preview port)
- **Use case**: Test production build locally to catch issues before deployment

### Build Commands

#### `npm run build`
Build the application for production (standard build).

```bash
npm run build
```

- **Output**: `dist/` directory
- **Use case**: Production deployment to standard hosting (not GitHub Pages)
- **Base path**: `/` (root)

#### `npm run build:dev`
Build the application in development mode.

```bash
npm run build:dev
```

- **Output**: `dist/` directory
- **Use case**: Testing production build with development optimizations
- **Note**: Includes development-specific optimizations

#### `npm run build:gh-pages`
Build the application optimized for GitHub Pages deployment.

```bash
npm run build:gh-pages
```

- **Output**: `dist/` directory
- **Base path**: `/ressy-ai-crm/` (configured for GitHub Pages)
- **Environment**: Sets `GITHUB_PAGES=true`
- **Use case**: Building for GitHub Pages deployment
- **Note**: This is the command used by CI/CD pipeline

### Code Quality Commands

#### `npm run format`
Format all code files using Prettier.

```bash
npm run format
```

- **Tool**: Prettier
- **Files**: Formats `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css`, `.scss`, `.md` files in `src/`
- **Use case**: Auto-format code to maintain consistent style
- **Note**: This modifies files in place

#### `npm run format:check`
Check if code is properly formatted without making changes.

```bash
npm run format:check
```

- **Tool**: Prettier
- **Use case**: Verify code formatting in CI/CD pipeline
- **Note**: Exits with error code if files are not formatted
- **CI/CD**: Runs automatically in the lint-quality job

#### `npm run lint`
Run ESLint to check code quality and find potential issues.

```bash
npm run lint
```

- **Tool**: ESLint
- **Use case**: Code quality checks, finding bugs, enforcing coding standards
- **Note**: Also runs automatically in CI/CD pipeline after format check

### Testing Commands

#### `npm run test`
Run tests in watch mode (interactive).

```bash
npm run test
```

- **Tool**: Vitest
- **Use case**: Development testing with hot reload
- **Note**: Runs in watch mode, re-runs tests on file changes

#### `npm run test:ci`
Run all tests once with coverage report (for CI/CD).

```bash
npm run test:ci
```

- **Tool**: Vitest with coverage
- **Output**: Generates coverage report in `coverage/` directory
- **Use case**: CI/CD pipeline, pre-commit hooks
- **CI/CD**: Runs automatically in the unit-tests job
- **Coverage**: Includes text, JSON, and HTML reports

#### `npm run test:watch`
Run tests in watch mode (alternative to `npm run test`).

```bash
npm run test:watch
```

- **Tool**: Vitest
- **Use case**: Continuous testing during development
- **Note**: Same as `npm run test`

### Deployment Commands

#### `npm run deploy`
Build and deploy to GitHub Pages using gh-pages.

```bash
npm run deploy
```

- **Steps**:
  1. Runs `npm run build:gh-pages` to build the app
  2. Deploys the `dist/` folder to the `gh-pages` branch
- **Use case**: Manual deployment to GitHub Pages
- **Requirements**: 
  - `gh-pages` package installed (already in devDependencies)
  - GitHub repository configured
- **Note**: Automatic deployment via GitHub Actions is recommended

## 🏗️ Project Structure

```
ressy-ai-crm/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD pipeline configuration
├── public/
│   ├── .nojekyll               # Prevents Jekyll processing
│   ├── favicon.ico
│   ├── ressy-logo.png
│   └── ressy-white.png
├── src/
│   ├── components/              # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── CallDetailModal.tsx
│   │   ├── CallTranscriptsTable.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DatabaseTable.tsx
│   │   ├── LoginPage.tsx
│   │   └── ...
│   ├── data/
│   │   └── mockData.ts         # Mock data for development
│   ├── services/
│   │   └── api.ts              # API service layer
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # Entry point
├── .dockerignore
├── Dockerfile                  # Docker configuration
├── nginx.conf                  # Nginx configuration
├── package.json
├── vite.config.ts              # Vite configuration
└── README.md
```

## 🚢 Deployment

### GitHub Pages (Automatic - Recommended)

The project is configured for automatic deployment via GitHub Actions.

1. **Enable GitHub Pages:**
   - Go to repository settings → Pages
   - Under "Source", select **"GitHub Actions"**

2. **Push to main branch:**
   - The CI/CD pipeline automatically builds and deploys
   - Site available at: `https://maugus0.github.io/ressy-ai-crm/`

### GitHub Pages (Manual)

If you prefer manual deployment:

```bash
npm run deploy
```

### Docker Deployment

Build and run with Docker:

```bash
# Build Docker image
docker build -t ressy-ai-crm .

# Run container
docker run -p 80:80 ressy-ai-crm
```

The Docker image includes:
- Multi-stage build for optimization
- Nginx server for serving static files
- Production-ready configuration

## 🔧 Configuration

### Base Path Configuration

The application is configured for GitHub Pages with base path `/ressy-ai-crm/`. If you need to change this:

1. **Update `vite.config.ts`** (line 10):
   ```typescript
   const base = process.env.GITHUB_PAGES === "true" ? "/ressy-ai-crm/" : "/";
   ```

2. **Update `src/App.tsx`** (line 25):
   ```typescript
   if (typeof window !== "undefined" && window.location.pathname.startsWith("/ressy-ai-crm")) {
     return "/ressy-ai-crm";
   }
   ```

3. **Update `src/services/api.ts`** (line 12):
   ```typescript
   if (typeof window !== "undefined" && window.location.pathname.startsWith("/ressy-ai-crm")) {
     return "/ressy-ai-crm";
   }
   ```

### Custom Domain

For custom domains, set the base path to `/` in `vite.config.ts`:

```typescript
const base = "/";
```

## 🧪 Development

### Mock Data

The application uses mock data for development. All API calls are mocked in `src/services/api.ts`:

- **Login credentials**: `admin@ressy.com` / `Ressy123`
- **Mock calls**: 20 sample calls with full transcripts
- **Mock analytics**: Complete analytics data
- **Mock customers**: Sample customer database

### Environment Variables

Create a `.env` file for local development:

```env
VITE_API_URL=http://localhost:5001/api
```

## 🔒 Authentication

The application uses mocked authentication:

- **Email**: `admin@ressy.com`
- **Password**: `Ressy123`

All authentication is handled client-side with mock data. No backend connection required for development.

## 🐛 Troubleshooting

### Assets not loading on GitHub Pages
- Verify base path is correct in `vite.config.ts`
- Check that `public/.nojekyll` exists
- Clear browser cache

### Build fails
- Ensure Node.js version is 18 or higher
- Delete `node_modules` and run `npm install` again
- Check for TypeScript errors: `npm run lint`

### Routing issues
- Verify base path configuration matches repository name
- Check browser console for routing errors
- Ensure all routes use React Router's `Link` component

## 📦 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Routing**: React Router v6
- **State Management**: TanStack Query
- **Charts**: Recharts
- **Icons**: Lucide React
- **Type Safety**: TypeScript

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is for internal use at RessyAI.

## 🔗 Links

- **Live Site**: [https://maugus0.github.io/ressy-ai-crm/](https://maugus0.github.io/ressy-ai-crm/)
- **Repository**: [https://github.com/maugus0/ressy-ai-crm](https://github.com/maugus0/ressy-ai-crm)

---

**Built with ❤️ by the RessyAI team**
