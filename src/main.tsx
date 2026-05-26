import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/authProvider.tsx'
import { BrowserRouter } from 'react-router-dom'
import { installLegacyAlertBridge } from './utils/notify.ts'

installLegacyAlertBridge()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster richColors closeButton position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
