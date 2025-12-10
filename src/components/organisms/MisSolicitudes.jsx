// En: src/components/organisms/MisSolicitudes.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import Card from '../molecules/Card';
import Badge from '../atoms/Badge';
import Icon from '../atoms/Icon';
import CustomButton from '../atoms/CustomButton';

const MisSolicitudes = () => {
  const { user } = useAuth();
  const { solicitudes, actualizarSolicitud } = useAppData();

  // Obtener el studentId de diferentes ubicaciones posibles
  const studentId = user?.student?.id || user?.id || user?.student?.studentCode;

  const misSolicitudes = solicitudes.filter(s => {
    // Comparar considerando que pueden ser strings o números
    const solicitudStudentId = String(s.studentId);
    const currentStudentId = String(studentId);
    
    return solicitudStudentId === currentStudentId && 
           ['pending', 'accepted', 'rescheduled'].includes(s.status);
  });

  // Console para ver la estructura de las solicitudes
  console.log('🔍 Mis Solicitudes:', misSolicitudes);

  const handleConfirmarReprogramacion = (solicitudId) => {
    if (window.confirm("¿Aceptas la nueva fecha y horario propuestos por el profesor?")) {
      actualizarSolicitud(solicitudId, { status: 'accepted' });
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'text-yellow-600', icon: 'Clock', message: 'Tu solicitud está siendo revisada.' };
      case 'accepted':
        return { color: 'text-green-600', icon: 'CheckCircle', message: '¡Aceptada! Prepárate para tu asesoría.' };
      case 'rescheduled':
        return { color: 'text-blue-600', icon: 'Calendar', message: 'Reprogramada. Revisa los nuevos detalles.' };
      default:
        return { color: 'text-gray-600', icon: 'Info', message: 'Estado desconocido.' };
    }
  };

  // ==================================================================
  // ¡NUEVA FUNCIÓN PARA TRADUCIR ESTADOS!
  // ==================================================================
  const traducirEstado = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'accepted':
        return 'Aceptado';
      case 'rescheduled':
        return 'Reprogramado';
      default:
        return status;
    }
  };

  if (!studentId) {
    return <div className="text-center py-16">Cargando datos del estudiante...</div>;
  }

  if (misSolicitudes.length === 0) {
    return (
      <div className="text-center py-16">
        <Icon name="ClipboardCheck" size={64} className="mx-auto mb-6 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Mis Solicitudes Activas</h2>
        <p className="text-gray-500 text-lg">No tienes solicitudes pendientes o programadas.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-600 mb-8">Mis Solicitudes Activas</h2>
      <div className="space-y-6">
        {misSolicitudes.map((solicitud) => {
          const statusInfo = getStatusInfo(solicitud.status);
          
          return (
            <Card
              key={solicitud.id}
              variant="solicitud"
              header={
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="text-xl font-bold">{solicitud.subject} - {solicitud.topic}</h5>
                    <small className="text-white/80 flex items-center gap-1 mt-1">
                      <Icon name="Calendar" size={16} />
                      Solicitud enviada: {new Date(solicitud.createdAt).toLocaleDateString('es-ES')}
                    </small>
                  </div>
                  {/* ================================================================== */}
                  {/* ¡AQUÍ USAMOS LA TRADUCCIÓN EN EL BADGE! */}
                  {/* ================================================================== */}
                  <Badge variant={solicitud.status}>{traducirEstado(solicitud.status)}</Badge>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ... (resto de los detalles de la solicitud) ... */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="UserCheck" size={18} className="text-blue-500" />
                    <strong>Profesor:</strong> {
                      solicitud.professor?.user?.name || 
                      solicitud.professor?.name || 
                      solicitud.professorName || 
                      'No asignado'
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Calendar" size={18} className="text-blue-500" />
                    <strong>Fecha:</strong> {new Date(solicitud.date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Clock" size={18} className="text-blue-500" />
                    <strong>Horario:</strong> {solicitud.timeSlot}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon name="Users" size={18} className="text-blue-500" />
                    <strong>Tipo:</strong> {solicitud.type}
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="MessageSquare" size={18} className="text-blue-500 mt-1" />
                    <div>
                      <strong>Descripción:</strong>
                      <p className="text-gray-600 mt-1">{solicitud.description || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`mt-6 p-4 rounded-lg border-l-4 flex items-center gap-3 ${solicitud.status === 'accepted' ? 'bg-green-50 border-green-400' : solicitud.status === 'rescheduled' ? 'bg-blue-50 border-blue-400' : 'bg-yellow-50 border-yellow-400'}`}>
                <Icon name={statusInfo.icon} size={20} className={statusInfo.color} />
                <div>
                  {/* ================================================================== */}
                  {/* ¡Y AQUÍ USAMOS LA TRADUCCIÓN EN EL MENSAJE DE ESTADO! */}
                  {/* ================================================================== */}
                  <p className={`font-medium ${statusInfo.color}`}>
                    Estado: {traducirEstado(solicitud.status)}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">{statusInfo.message}</p>
                </div>
              </div>

              {solicitud.status === 'rescheduled' && (
                <div className="mt-4 p-4 bg-blue-100 border-l-4 border-blue-500 rounded-r-lg">
                  <p className="font-bold text-blue-800">¡Atención! El profesor ha reprogramado esta asesoría.</p>
                  <p className="text-gray-600 text-sm mt-2">Motivo: {solicitud.rejectionReason}</p>
                  <CustomButton 
                    onClick={() => handleConfirmarReprogramacion(solicitud.id)}
                    variant="success" size="sm" className="mt-3" icon="Check"
                  >
                    Entendido y Aceptado
                  </CustomButton>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MisSolicitudes;
