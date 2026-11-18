import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';

// Envoyer automatiquement le cookie httpOnly sur toutes les requêtes Axios
axios.defaults.withCredentials = true;

// Import the global theme.  This file defines colour variables and
// animations for the entire application.
import './styles/theme.css';

// Create a React root and render the application.  The React.StrictMode
// wrapper helps catch potential problems in an application by
// intentionally double‑invoking certain lifecycle methods.  See
// https://react.dev/reference/react/StrictMode for more details.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);