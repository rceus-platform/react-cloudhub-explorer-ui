# Cloud Hub Explorer UI

## Overview

The Cloud Hub Explorer UI is a modern, feature-rich file explorer interface built with React 19 and TypeScript. It allows users to browse, search, and manage files stored across multiple cloud providers including Google Drive and MEGA, with a focus on media consumption and security.

## Features

### Core Functionality

- **Unified File Explorer**: Browse files from all connected cloud providers in a single interface.
- **Multi-Cloud Support**: Seamless integration with Google Drive and MEGA.
- **Multi-Account Management**: Connect and manage multiple accounts per provider simultaneously.
- **Real-time Search**: Powerful search functionality with optional persistence.
- **Flexible Layout**: Custom grid columns and responsive design for all screen sizes.
- **Direct Streaming**: Direct playback of videos and high-speed image viewing.

### Security & Privacy

- **Passcode Protection**: Secure the entire interface with a 4-digit passcode access layer.
- **Session Management**: Automated session handling with secure unlock flows.

### Media Management

- **Integrated Video Player**: Modern video player with advanced playback controls.
- **Thumbnail Ecosystem**:
  - Automated thumbnail previews for images and videos.
  - **Manual Upload**: Upload custom thumbnails for any file.
  - **Frame Capture**: Capture specific frames from videos to use as thumbnails.
- **Playback Persistence**: Automatically saves and resumes video playback progress.

## Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **State Management**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Styling**: Vanilla CSS with CSS Variables & CSS Modules
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd react-cloudhub-explorer-ui/application-source
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

Create a `.env` file in the `application-source` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SITE_PASSCODE=<your_4_digit_passcode>
VITE_PERSIST_SEARCH_CACHE=true
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Testing

Run the test suite:

```bash
npm test
```

## Project Structure

```
src/
├── components/      # Shared UI components (Skeletons, etc.)
├── context/         # Global state (AuthContext, etc.)
├── features/        # Feature-driven modules
│   ├── accounts/    # Cloud account management
│   ├── auth/        # Passcode and authentication
│   ├── files/       # File library, thumbnails, and explorer
│   └── video-player/# Integrated media player
├── hooks/           # Shared React hooks
├── pages/           # Route-level page components
├── services/        # API clients and core business logic
├── types/           # Global TypeScript definitions
└── App.tsx          # Root router and layout orchestration
```

## Core Components

### Account Management

- **AccountManager**: Unified dashboard for connecting and monitoring cloud accounts.
- **AccountCard**: Detailed status for individual Google Drive or MEGA accounts.

### File Explorer

- **FileLibrary**: The main browsing engine with history management and breadcrumbs.
- **FileCard**: Interactive card with metadata display and context actions.
- **ThumbnailModal**: Interface for capturing frames or uploading custom file covers.

### Security

- **PasscodeOverlay**: High-security entry screen for the application.

## Environment Variables

| Variable                    | Description                            | Default                 |
| --------------------------- | -------------------------------------- | ----------------------- |
| `VITE_API_BASE_URL`         | Endpoint for the Python CloudHub API   | `http://localhost:8000` |
| `VITE_SITE_PASSCODE`        | 4-digit code required to unlock the UI | `<your_4_digit_passcode>` |
| `VITE_PERSIST_SEARCH_CACHE` | Keep search results in local storage   | `true`                  |

---

Built with ❤️ for a better cloud exploration experience.
