import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@repo/ui/globals.css';

import App from './App';
import { QueryProvider } from './components/providers/query-provider';
import { ThemeProvider } from './components/providers/theme-provider';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <QueryProvider>
                <App />
            </QueryProvider>
        </ThemeProvider>
    </StrictMode>
);
