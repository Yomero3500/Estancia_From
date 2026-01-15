import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../context/AuthContext';
import { useSessionTransfer } from '../hooks/useSessionTransfer';
import Header from '../components/organisms/Header';
import TabNavigation from '../components/molecules/TabNavigation';
import HistorialDirector from '../components/organisms/HistorialDirector';
import ReportesDirector from '../components/organisms/ReportesDirector';

const DirectorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('historial');
  const transferStatus = useSessionTransfer();

  // Capturar token de la URL, decodificarlo y guardar en localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    // Guardar en localStorage si existe el token
    if (token) {
      try {
        // Decodificar el token para extraer la información del usuario
        const decodedToken = jwtDecode(token);
        console.log('🔓 Token decodificado:', decodedToken);
        
        // Extraer datos directamente del token decodificado
        const userID = decodedToken.id;
        const email = decodedToken.email;
        const role = decodedToken.role;
        
        // Normalizar la estructura para que sea compatible con el sistema
        const normalizedUser = {
          id: userID,
          email: email,
          name: email.split('@')[0], // Usar la parte antes del @ como nombre temporal
          role: 'director',
          director: {
            id: userID,
            name: email.split('@')[0],
            email: email,
            telefono: '',
            estado: 'Activo'
          }
        };
        
        // Guardar en localStorage con la estructura normalizada
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        localStorage.setItem('token', token);
        localStorage.setItem('userID', userID);
        localStorage.setItem('userType', 'director');
        
        console.log('✅ Datos normalizados y guardados en localStorage desde token decodificado');
        console.log('User normalizado:', normalizedUser);
        console.log('Token:', token);
        console.log('UserID:', userID);
        
        // Limpiar la URL después de guardar los datos
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Recargar para que AuthContext tome los nuevos datos
        window.location.reload();
      } catch (error) {
        console.error('❌ Error al decodificar token:', error);
      }
    }
  }, []);

  const tabs = [
    { id: 'historial', label: 'Historial General', icon: 'History' },
    { id: 'reportes', label: 'Reportes', icon: 'FileText' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'historial':
        return <HistorialDirector />;
      case 'reportes':
        return <ReportesDirector />;
      default:
        return <HistorialDirector />;
    }
  };

  // Mostrar pantalla de carga o error durante la transferencia
  if (transferStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando datos de sesión...</p>
        </div>
      </div>
    );
  }

  if (transferStatus.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de Autenticación</h2>
          <p className="text-gray-600 mb-6">{transferStatus.error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Panel del Director" 
        subtitle={`Bienvenido, ${user?.email || 'Director'}`}
        userType="director"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;

