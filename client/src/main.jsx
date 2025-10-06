import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import NewPatient from './pages/NewPatient.jsx';
import NewSurgery from './pages/NewSurgery.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './styles.css';
import { AuthProvider } from './context/AuthContext.jsx';

function Layout({ children }) {
  return (
    <div className="container">
      <header className="topbar">
        <Link to="/" className="brand">Surgery Dashboard</Link>
      </header>
      <main>{children}</main>
    </div>
  );
}

function App() {
  return (
    // ✅ Provide Auth context globally
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/surgeries/new"
            element={
              <ProtectedRoute>
                <Layout><NewSurgery /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/new"
            element={
              <ProtectedRoute>
                <Layout><NewPatient /></Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
