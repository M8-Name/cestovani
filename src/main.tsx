import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { Home } from './pages/Home'
import { TripHome } from './pages/TripHome'
import { Transport } from './pages/Transport'
import { Lodging } from './pages/Lodging'
import { Program } from './pages/Program'
import { Day } from './pages/Day'
import { seedTrips } from './lib/seed'
import { Restaurants } from './pages/Restaurants'

registerSW({ immediate: true })
seedTrips()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trip/:id" element={<TripHome />} />
        <Route path="/trip/:id/transport" element={<Transport />} />
        <Route path="/trip/:id/lodging" element={<Lodging />} />
        <Route path="/trip/:id/program" element={<Program />} />
        <Route path="/trip/:id/program/:date" element={<Day />} />
        <Route path="/trip/:id/restaurants" element={<Restaurants />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
