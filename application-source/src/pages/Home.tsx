/**
 * Home Page Module
 *
 * Responsibilities:
 * - Act as the root entry for the file explorer view
 * - Mount the FileLibrary feature component
 *
 * Boundaries:
 * - Does not handle business logic or API calls (delegated to features/files)
 */

import React from "react";
import { FileLibrary } from "../features/files";

/** Root page for browsing and managing the cloud file library */
const Home: React.FC = () => {
    return <FileLibrary />;
};

export default Home;