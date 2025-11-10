# RessyAI CRM Frontend

This is the frontend application for the RessyAI CRM, a modern customer relationship management platform designed to help businesses manage leads, contacts, and sales efficiently. Built with React, Vite, and Tailwind CSS, this project provides a fast and responsive user interface for interacting with RessyAI's CRM features.

## Features
- Dashboard and analytics
- Call transcripts and details
- Database and expenses management
- Integrations and settings
- User authentication (login/register)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation
Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd ressy-ai-crm
npm install
```

### Running the Development Server
Start the app locally:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) by default.

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment to GitHub Pages

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Automatic Deployment

1. **Enable GitHub Pages:**
   - Go to your repository settings on GitHub
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "GitHub Actions"

2. **Push to main branch:**
   - The GitHub Actions workflow will automatically build and deploy your site
   - The workflow is triggered on pushes to `main` or `master` branch
   - Your site will be available at: `https://maugus0.github.io/ressy-ai-crm/`

### Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Install gh-pages if not already installed
npm install --save-dev gh-pages

# Build and deploy
npm run deploy
```

### Important Notes

- The base path is set to `/ressy-ai-crm/` for GitHub Pages
- If you change the repository name, update the base path in:
  - `vite.config.ts` (line 10)
  - `src/App.tsx` (line 25)
  - `src/services/api.ts` (line 12)
- For custom domains, set the base path to `/` in `vite.config.ts`

## Project Structure
See the `src/` folder for main components, pages, and utilities.

## License
This project is for internal use at RessyAI.
