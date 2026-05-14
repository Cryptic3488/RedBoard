import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SplashScreen } from '@capacitor/splash-screen'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

SplashScreen.hide()
