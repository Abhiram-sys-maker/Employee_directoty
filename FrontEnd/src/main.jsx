import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from '@primereact/core'

import './index.css'
import 'primeicons/primeicons.css'

import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrimeReactProvider unstyled={true}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </PrimeReactProvider>
  </StrictMode>,
)