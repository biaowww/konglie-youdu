import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import EchoGame from './EchoGame'
import './echo.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EchoGame />
  </StrictMode>,
)
