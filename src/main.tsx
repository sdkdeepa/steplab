import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AppStatus } from './components/AppStatus'
import { resetIfAsked, setupPwa } from './lib/pwa'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter-tight/600.css'
import '@fontsource/inter-tight/700.css'
import '@fontsource/inter-tight/800.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './styles.css'

resetIfAsked().then((resetting) => {
  if (resetting) return
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
      <AppStatus />
    </StrictMode>,
  )
  void setupPwa()
})
