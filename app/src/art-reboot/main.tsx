import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ArtRebootApp from './ArtRebootApp'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ArtRebootApp />
  </StrictMode>,
)
