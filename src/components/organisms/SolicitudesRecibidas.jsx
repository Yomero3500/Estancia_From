// En: src/components/organisms/SolicitudesRecibidas.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import Card from '../molecules/Card';
import CustomButton from '../atoms/CustomButton';
import Badge from '../atoms/Badge';
import Icon from '../atoms/Icon';
import Modal from '../molecules/Modal';
import FormGroup from '../molecules/FormGroup';

const SolicitudesRecibidas = () => {
  const { user } = useAuth();
  const { solicitudes, actualizarSolicitud, generarHorariosDisponibles } = useAppData();
  
  const [modalReprogramar, setModalReprogramar] = useState({ isOpen: false, solicitud: null });
  const [formReprogramar, setFormReprogramar] = useState({
    nuevaFecha: '',
    nuevoHorario: '',
    motivo: ''
  });
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);

  const professorId = user?.professor?.id;
  const solicitudesRecibidas = solicitudes.filter(
    s => s.professorId === professorId && s.status === 'pending'
  );

  // ==================================================================
  // 1. ¡AQUÍ ESTÁ LA FUNCIÓN DE TRADUCCIÓN!
  // ==================================================================
  const traducirEstado = (status) => {
    const traducciones = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      completed: 'Completada',
      rescheduled: 'Reprogramada',
    };
    return traducciones[status] || status; // Devuelve la traducción o el original si no se encuentra
  };

  const handleAceptarSolicitud = (solicitudId) => {
    if (window.confirm('¿Estás seguro de que quieres aceptar esta solicitud?')) {
      actualizarSolicitud(solicitudId, { status: 'accepted' });
    }
  };

  const handleRechazarSolicitud = (solicitudId) => {
    const motivo = prompt("Por favor, introduce el motivo del rechazo:");
    if (motivo) {
      actualizarSolicitud(solicitudId, {
        status: 'rejected',
        rejectionReason: motivo
      });
    } else if (motivo === "") {
      alert("El motivo del rechazo no puede estar vacío.");
    }
  };

  const handleAbrirModalReprogramar = (solicitud) => {
    setModalReprogramar({ isOpen: true, solicitud });
    setFormReprogramar({
      nuevaFecha: solicitud.date.split('T')[0],
      nuevoHorario: '',
      motivo: ''
    });
  };

  const handleConfirmarReprogramacion = async () => {
    const { solicitud } = modalReprogramar;
    const { nuevaFecha, nuevoHorario, motivo } = formReprogramar;

    if (!nuevaFecha || !nuevoHorario) {
      alert('Por favor, completa la nueva fecha y el nuevo horario.');
      return;
    }

    const horarioSeleccionado = horariosDisponibles.find(h => h.id === parseInt(nuevoHorario));
    if (!horarioSeleccionado) {
      alert('Horario no válido.');
      return;
    }
    const timeSlotString = `${horarioSeleccionado.startTime.slice(0, 5)} - ${horarioSeleccionado.endTime.slice(0, 5)}`;

    actualizarSolicitud(solicitud.id, {
      status: 'rescheduled',
      date: nuevaFecha,
      timeSlot: timeSlotString,
      rejectionReason: motivo || 'Reprogramado por el profesor'
    });

    setModalReprogramar({ isOpen: false, solicitud: null });
  };

  useEffect(() => {
    const fetchHorarios = async () => {
      if (modalReprogramar.solicitud && formReprogramar.nuevaFecha) {
        const horarios = await generarHorariosDisponibles(
          modalReprogramar.solicitud.professorId,
          formReprogramar.nuevaFecha
        );
        setHorariosDisponibles(horarios);
        setFormReprogramar(prev => ({ ...prev, nuevoHorario: '' }));
      }
    };
    fetchHorarios();
  }, [modalReprogramar.solicitud, formReprogramar.nuevaFecha, generarHorariosDisponibles]);

  const diasSemanaTraductor = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
    thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
  };

  if (!professorId) return <div>Cargando...</div>;

  if (solicitudesRecibidas.length === 0) {
    return (
      <div className="text-center py-16">
        <Icon name="Inbox" size={64} className="mx-auto mb-6 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Solicitudes de Asesoría Recibidas</h2>
        <p className="text-gray-500 text-lg">No tienes solicitudes pendientes.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-600 mb-8 flex items-center gap-3">
        <Icon name="Inbox" size={28} /> Solicitudes de Asesoría Recibidas
      </h2>
      <div className="space-y-6">
        {solicitudesRecibidas.map((solicitud) => (
          <Card key={solicitud.id} variant="solicitud"
            header={
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="text-xl font-bold flex items-center gap-2">
                    <Icon name="BookOpen" size={20} /> {solicitud.subject} - {solicitud.topic}
                  </h5>
                  <small className="text-blue-100 flex items-center gap-1 mt-1">
                    <Icon name="Calendar" size={16} /> Solicitud enviada: {new Date(solicitud.createdAt).toLocaleDateString('es-ES')}
                  </small>
                </div>
                {/* ================================================================== */}
                {/* 2. ¡AQUÍ USAMOS LA FUNCIÓN DE TRADUCCIÓN! */}
                {/* ================================================================== */}
                <Badge variant={solicitud.status}>{traducirEstado(solicitud.status)}</Badge>
              </div>
            }
            footer={
              <div className="flex gap-3 flex-wrap">
                <CustomButton variant="success" size="sm" icon="Check" onClick={() => handleAceptarSolicitud(solicitud.id)}>Aceptar</CustomButton>
                <CustomButton variant="info" size="sm" icon="Calendar" onClick={() => handleAbrirModalReprogramar(solicitud)}>Reprogramar</CustomButton>
                <CustomButton variant="danger" size="sm" icon="X" onClick={() => handleRechazarSolicitud(solicitud.id)}>Rechazar</CustomButton>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Icon name="User" size={18} className="text-blue-500 mt-1" />
                  <div>
                    <strong>Estudiante:</strong>
                    <div className="text-gray-700">
                      <p>{solicitud.studentName || solicitud.student?.user?.name || 'No disponible'}</p>
                      <p className="text-sm text-gray-500">
                        {solicitud.studentMatricula || solicitud.student?.studentCode}
                        {solicitud.student?.semester && ` | ${solicitud.student.semester}º Cuatrimestre`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Calendar" size={18} className="text-blue-500" />
                  <strong>Fecha solicitada:</strong> {new Date(solicitud.date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
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
                    <p className="text-gray-600 mt-1">{solicitud.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* El Modal no necesita cambios */}
      <Modal isOpen={modalReprogramar.isOpen} onClose={() => setModalReprogramar({ isOpen: false, solicitud: null })}
        title={<div className="flex items-center gap-2"><Icon name="Calendar" size={20} /> Reprogramar Asesoría</div>}
        footer={
          <div className="flex gap-3 justify-end">
            <CustomButton variant="secondary" onClick={() => setModalReprogramar({ isOpen: false, solicitud: null })}>Cancelar</CustomButton>
            <CustomButton variant="primary" icon="Check" onClick={handleConfirmarReprogramacion}>Confirmar Reprogramación</CustomButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup label="Nueva Fecha" icon="Calendar" type="date" value={formReprogramar.nuevaFecha} onChange={(e) => setFormReprogramar(prev => ({ ...prev, nuevaFecha: e.target.value }))} required />
          <FormGroup label="Nuevo Horario" icon="Clock" type="select" value={formReprogramar.nuevoHorario}
            onChange={(e) => setFormReprogramar(prev => ({ ...prev, nuevoHorario: e.target.value }))}
            options={horariosDisponibles.map(h => ({
              value: h.id,
              label: `${diasSemanaTraductor[h.dayOfWeek] || h.dayOfWeek} ${h.startTime.slice(0, 5)} - ${h.endTime.slice(0, 5)}`
            }))}
            placeholder="Seleccione un horario" required
            disabled={horariosDisponibles.length === 0}
          />
        </div>
        <FormGroup label="Motivo de la reprogramación (Opcional)" icon="MessageSquare" type="textarea" value={formReprogramar.motivo} onChange={(e) => setFormReprogramar(prev => ({ ...prev, motivo: e.target.value }))} placeholder="Explique el motivo de la reprogramación..." rows={3} />
      </Modal>
    </div>
  );
};

export default SolicitudesRecibidas;
