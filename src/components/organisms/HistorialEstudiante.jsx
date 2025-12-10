// En: src/components/organisms/HistorialEstudiante.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import Table from '../molecules/Table';
import Badge from '../atoms/Badge';
import Icon from '../atoms/Icon';

const HistorialEstudiante = () => {
  const { user } = useAuth();
  const { solicitudes } = useAppData();

  // Obtener el studentId de diferentes ubicaciones posibles
  const studentId = user?.student?.id || user?.id || user?.student?.studentCode;

  const historial = solicitudes.filter(s => {
    // Comparar considerando que pueden ser strings o números
    const solicitudStudentId = String(s.studentId);
    const currentStudentId = String(studentId);
    
    return solicitudStudentId === currentStudentId && 
           ['completed', 'rejected'].includes(s.status);
  });

  // ==================================================================
  // ¡NUEVA FUNCIÓN PARA TRADUCIR ESTADOS!
  // ==================================================================
  const traducirEstado = (status) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'rejected':
        return 'Rechazado';
      default:
        // Devuelve el estado original si no hay traducción
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const columns = [
    {
      key: 'date',
      label: 'Fecha',
      icon: 'Calendar',
      render: (date) => new Date(date).toLocaleDateString('es-ES', { timeZone: 'UTC' })
    },
    {
      key: 'professor',
      label: 'Profesor',
      icon: 'UserCheck',
      render: (professor) => professor?.user?.name || 'No asignado'
    },
    // ... (columnas de tema y materia que faltaban, las añado para que esté completo)
    {
      key: 'subject',
      label: 'Materia',
      icon: 'Book'
    },
    {
      key: 'topic',
      label: 'Tema',
      icon: 'BookOpen'
    },
    {
      key: 'status',
      label: 'Estado',
      icon: 'Flag',
      // ==================================================================
      // ¡AQUÍ USAMOS LA FUNCIÓN DE TRADUCCIÓN!
      // ==================================================================
      render: (status) => <Badge variant={status}>{traducirEstado(status)}</Badge>
    },
    {
      key: 'rejectionReason',
      label: 'Observaciones',
      icon: 'MessageSquare',
      render: (motivo) => motivo || '-'
    }
  ];

  if (!studentId) {
    return <div className="text-center py-16">Cargando datos del estudiante...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-600 mb-8">Historial de Asesorías</h2>
      <Table
        columns={columns}
        data={historial}
        emptyMessage="No tienes asesorías completadas o rechazadas en tu historial."
      />
    </div>
  );
};

export default HistorialEstudiante;
