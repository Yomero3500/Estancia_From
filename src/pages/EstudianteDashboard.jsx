import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useSessionTransfer } from '../hooks/useSessionTransfer';
import Header from '../components/organisms/Header';
import TabNavigation from '../components/molecules/TabNavigation';
import SolicitarAsesoria from '../components/organisms/SolicitarAsesoria';
import MisSolicitudes from '../components/organisms/MisSolicitudes';
import HistorialEstudiante from '../components/organisms/HistorialEstudiante';

const EstudianteDashboard = () => {
  const [activeTab, setActiveTab] = useState('solicitar');
  const { user } = useAuth();
  const { solicitudes } = useAppData();
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
          role: role === 'alumno' || role === 'estudiante' ? 'student' : role,
          student: {
            id: userID,
            studentCode: userID,
            status: 'Activo',
            cohortId: null,
            tutorId: null
          }
        };
        
        // Guardar en localStorage con la estructura normalizada
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        localStorage.setItem('token', token);
        localStorage.setItem('userID', userID);
        localStorage.setItem('userType', 'student');
        
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

  // Calcular notificaciones
  const solicitudesConRespuesta = solicitudes.filter(s => 
    s.estudianteId === user?.id && 
    (s.status === 'aceptada' || s.status === 'rechazada' || s.status === 'reprogramada')
  ).length;

  const tabs = [
    {
      id: 'solicitar',
      label: 'Solicitar Asesoría',
      icon: 'PlusCircle'
    },
    {
      id: 'mis-solicitudes',
      label: 'Mis Solicitudes',
      icon: 'List',
      badge: solicitudesConRespuesta > 0 ? solicitudesConRespuesta : null
    },
    {
      id: 'historial',
      label: 'Historial de Asesorías',
      icon: 'History'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'solicitar':
        return <SolicitarAsesoria />;
      case 'mis-solicitudes':
        return <MisSolicitudes />;
      case 'historial':
        return <HistorialEstudiante />;
      default:
        return <SolicitarAsesoria />;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Header />
      
      <main className="max-w-7xl mx-auto p-10">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-0"
        />
        
        <div className="bg-white rounded-b-2xl shadow-2xl p-10 min-h-[650px]">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default EstudianteDashboard;

