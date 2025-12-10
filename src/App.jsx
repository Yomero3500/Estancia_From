import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import Login from './components/organisms/Login';
import EstudianteDashboard from './pages/EstudianteDashboard';
import ProfesorDashboard from './pages/ProfesorDashboard';
import DirectorDashboard from './pages/DirectorDashboard';
import ProtectedRoute from './components/organisms/ProtectedRoute';
import './App.css';

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal - redirige a login */}
        {/* Ruta de login */}

        {/* Rutas protegidas para estudiantes */}
        <Route path="/estudiante" element={<EstudianteDashboard />} />
        
        {/* Rutas protegidas para profesores */}
        <Route path="/profesor" element={<ProfesorDashboard />} />
        
        {/* Rutas protegidas para director */}
        <Route path="/director" element={<DirectorDashboard />} />
        
        {/* Ruta catch-all - redirecciona a login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <AppContent />
      </AppDataProvider>
    </AuthProvider>
  );
}

export default App;

