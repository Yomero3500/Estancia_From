import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import FormGroup from '../molecules/FormGroup';
import CustomButton from '../atoms/CustomButton';
import Icon from '../atoms/Icon';

const SolicitarAsesoria = () => {
  const { user } = useAuth();
  const { agregarSolicitud, generarHorariosDisponibles, profesores: profesoresBackend } = useAppData();

  const [formData, setFormData] = useState({
    fecha: '',
    tema: '',
    materia: '',
    profesorId: '',
    horario: '', // Esto guardará el ID del horario seleccionado
    tipo: 'individual',
    descripcion: ''
  });

  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const materias = ['Matemáticas','Física','Química','Historia','Inglés','Literatura'];
  const tiposAsesoria = [
    { value: 'individual', label: 'Individual' },
    { value: 'group', label: 'Grupal' }
  ];

  const diasSemanaTraductor = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  useEffect(() => {
    const fetchHorarios = async () => {
      if (formData.profesorId && formData.fecha) {
        const horarios = await generarHorariosDisponibles(formData.profesorId, formData.fecha);
        setHorariosDisponibles(horarios || []);
        setFormData(prev => ({ ...prev, horario: '' }));
      } else {
        setHorariosDisponibles([]);
      }
    };
    fetchHorarios();
  }, [formData.profesorId, formData.fecha, generarHorariosDisponibles]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMensaje({ tipo: '', texto: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.profesorId || !formData.fecha || !formData.horario || !formData.tema || !formData.materia) {
      setMensaje({ tipo: 'error', texto: 'Por favor, completa todos los campos requeridos.' });
      return;
    }

    const horarioSeleccionado = horariosDisponibles.find(h => h.id === parseInt(formData.horario));
    if (!horarioSeleccionado) {
      setMensaje({ tipo: 'error', texto: 'El horario seleccionado no es válido.' });
      return;
    }

    const timeSlotString = `${horarioSeleccionado.startTime.slice(0, 5)} - ${horarioSeleccionado.endTime.slice(0, 5)}`;

    // --- ¡LA CORRECCIÓN DE ZONA HORARIA ESTÁ AQUÍ! ---
    const fechaUTC = new Date(formData.fecha + 'T00:00:00');

    // Obtener el studentId del usuario autenticado
    const studentId = user.student?.id || user.id || user.student?.studentCode;

    const solicitud = {
      studentId: studentId,
      studentName: user.name, // Agregar nombre del estudiante
      studentEmail: user.email, // Agregar email del estudiante
      date: fechaUTC,
      subject: formData.materia,
      topic: formData.tema,
      professorId: formData.profesorId,
      timeSlot: timeSlotString,
      type: formData.tipo,
      description: formData.descripcion,
    };

    const result = await agregarSolicitud(solicitud);

    if (result.success) {
      setFormData({
        fecha: '', tema: '', materia: '', profesorId: '',
        horario: '', tipo: 'individual', descripcion: ''
      });
      setMensaje({ tipo: 'success', texto: "¡Solicitud enviada exitosamente!" });
    } else {
      setMensaje({ tipo: 'error', texto: result.message || 'Error al enviar la solicitud.' });
    }
  };

  const fechaMinima = new Date().toISOString().split('T')[0];

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-600 mb-8 flex items-center gap-3">
        <Icon name="PlusCircle" size={28} /> Solicitar Asesoría
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup label="Fecha Deseada" icon="Calendar" type="date"
            value={formData.fecha} onChange={e => handleInputChange('fecha', e.target.value)}
            min={fechaMinima} required
          />
          <FormGroup label="Tema de la Asesoría" icon="BookOpen" type="text"
            value={formData.tema} onChange={e => handleInputChange('tema', e.target.value)}
            placeholder="Ej: Ecuaciones diferenciales" required
          />
          <FormGroup label="Materia" icon="Book" type="select"
            value={formData.materia} onChange={e => handleInputChange('materia', e.target.value)}
            options={materias.map(m => ({ value: m, label: m }))} placeholder="Seleccione una Materia" required
          />
          <FormGroup label="Profesor Deseado" icon="UserCheck" type="select"
            value={formData.profesorId} onChange={e => handleInputChange('profesorId', e.target.value)}
            options={(profesoresBackend || []).map(p => ({ value: p.id, label: p.name }))}
            placeholder="Seleccione un Profesor"
            required
          />
          <FormGroup
            label="Horario Preferido"
            icon="Clock"
            type="select"
            value={formData.horario}
            onChange={e => handleInputChange('horario', e.target.value)}
            options={horariosDisponibles.map(h => ({
              value: h.id,
              label: `${diasSemanaTraductor[h.dayOfWeek] || h.dayOfWeek} ${h.startTime.slice(0, 5)} - ${h.endTime.slice(0, 5)}`
            }))}
            placeholder={
              !formData.profesorId || !formData.fecha
                ? "Primero seleccione profesor y fecha"
                : horariosDisponibles.length === 0
                ? "No hay horarios disponibles"
                : "Seleccione un Horario"
            }
            disabled={!formData.profesorId || !formData.fecha || horariosDisponibles.length === 0}
            required
          />
          <FormGroup label="Tipo de Asesoría" icon="Users" type="select"
            value={formData.tipo} onChange={e => handleInputChange('tipo', e.target.value)}
            options={tiposAsesoria}
          />
        </div>
        <FormGroup label="Descripción del problema o tema" icon="MessageSquare" type="textarea"
          value={formData.descripcion} onChange={e => handleInputChange('descripcion', e.target.value)}
          placeholder="Describe brevemente lo que necesitas reforzar..." rows={3}
        />
        <div className="flex justify-center">
          <CustomButton type="submit" variant="primary" size="lg" icon="Send">Enviar Solicitud</CustomButton>
        </div>
        {mensaje.texto && (
          <div className={`p-4 rounded-lg border-l-4 flex items-center gap-3
            ${mensaje.tipo === 'success' ? 'bg-green-50 border-green-400 text-green-700' : 'bg-red-50 border-red-400 text-red-700'}`}>
            <Icon name={mensaje.tipo === 'success' ? 'CheckCircle' : 'AlertCircle'} size={20} />
            {mensaje.texto}
          </div>
        )}
      </form>
    </div>
  );
};

export default SolicitarAsesoria;
