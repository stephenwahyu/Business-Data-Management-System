import './bootstrap';
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import '../css/app.css';
import "leaflet/dist/leaflet.css";
import { initializeTheme } from './hooks/use-appearance';

// Initialize theme as early as possible in the React lifecycle
// This helps reduce flash of incorrect theme
initializeTheme();

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./pages/**/*.jsx', { eager: true })
    return pages[`./pages/${name}.jsx`]
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})