
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import NewPatient from './pages/NewPatient.jsx'
import NewSurgery from './pages/NewSurgery.jsx'
import './styles.css'

function Layout({children}){
  return (
    <div className="container">
      <header className="topbar">
        <Link to="/" className="brand">Surgery Dashboard</Link>
      </header>
      <main>{children}</main>
    </div>
  )
}

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Dashboard/></Layout>} />
        <Route path="/surgeries/new" element={<Layout><NewSurgery/></Layout>} />
        <Route path="/patients/new" element={<Layout><NewPatient/></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
