# CloudHub Explorer UI

A modern React application for exploring and managing CloudHub resources. Built with React, TypeScript, and Vite, offering a robust, performant, and developer-friendly experience.

## Features

- **Modern Architecture**: React with TypeScript for type-safe components and logic.
- **Lightning Fast**: Powered by Vite for instantaneous HMR and optimized production builds.
- **Cloud Integration**: Seamlessly integrates with the CloudHub Explorer API to visualize and interact with cloud resources.

## Prerequisites

Ensure you have the following installed on your local development machine:

- **Node.js**: v18.0.0 or higher
- **npm** (v9+) or **yarn** (v1.22+)

## Installation

1. Clone the repository and navigate to the application source directory:

   ```bash
   cd react-cloudhub-explorer-ui/application-source
   ```

2. Install the project dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

## Configuration

This project relies on environment variables for configuration. **Never commit sensitive credentials or secrets to version control.**

1. Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and configure the necessary variables for your local environment.

> **Note**: The `.env.local` file is included in `.gitignore` and will not be tracked by Git.

### Example Environment Variables (`.env.example`)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_API_TIMEOUT_MS=5000

# Feature Flags
VITE_ENABLE_MOCK_DATA=false

# Analytics (Optional)
VITE_ANALYTICS_ID=your_analytics_tracking_id_here
```

## Available Scripts

In the project directory, you can run:

### `npm run dev` or `yarn dev`

Starts the development server with Hot Module Replacement (HMR). Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### `npm run build` or `yarn build`

Builds the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run lint` or `yarn lint`

Runs ESLint to analyze the code and catch potential errors or stylistic issues.

### `npm run preview` or `yarn preview`

Boots up a local static web server that serves the files from the `dist` folder. Useful for previewing the production build locally.

## Tech Stack

- **Framework**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Linting**: [ESLint](https://eslint.org/)

## Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## License

Distributed under the MIT License. See `LICENSE` for more information.
