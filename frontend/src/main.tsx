import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@app/App';
import '@shared/ui/theme.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('index.html debe contener el elemento #root');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
