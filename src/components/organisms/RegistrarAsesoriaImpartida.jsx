import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import Card from '../molecules/Card';
import FormGroup from '../molecules/FormGroup';
import CustomButton from '../atoms/CustomButton';
import Icon from '../atoms/Icon';

const RegistrarAsesoriaImpartida = () => {
  const { user, getAuthHeaders, API_ENTRADAS_URL } = useAuth();
  const { profesores } = useAppData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [studentFound, setStudentFound] = useState(null);
  const [formData, setFormData] = useState({
    fecha: '',
    horaInicio: '',
    horaFin: '',
    materia: '',
    tema: '',
    tipoAsesoria: 'individual',
    descripcion: '',
    estudianteNombre: '',
    estudianteEmail: '',
    studentId: null // Guardar el ID del estudiante encontrado
  });

  // Opciones para tipo de asesoría
  const tiposAsesoria = [
    { value: 'individual', label: 'Individual' },
    { value: 'grupal', label: 'Grupal' }
  ];

  // Horas disponibles (07:00 - 18:00)
  const horas = Array.from({ length: 12 }, (_, i) => {
    const hora = i + 7;
    return {
      value: `${hora.toString().padStart(2, '0')}:00`,
      label: `${hora.toString().padStart(2, '0')}:00`
    };
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Buscar estudiante por email
  const buscarEstudiantePorEmail = async (email) => {
    if (!email || !email.includes('@')) {
      setStudentFound(null);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:3002/alumnos/email/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStudentFound(result.data);
          // Autocompletar el nombre y guardar el studentId
          setFormData(prev => ({
            ...prev,
            estudianteNombre: result.data.nombre,
            studentId: result.data.matricula // Usar matrícula como studentId
          }));
        } else {
          setStudentFound(null);
          setFormData(prev => ({
            ...prev,
            estudianteNombre: '',
            studentId: null
          }));
        }
      } else {
        setStudentFound(null);
        setFormData(prev => ({
          ...prev,
          estudianteNombre: '',
          studentId: null
        }));
      }
    } catch (error) {
      console.error('Error buscando estudiante:', error);
      setStudentFound(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Manejar cambio en el campo de email con búsqueda automática
  const handleEmailChange = (email) => {
    setFormData(prev => ({
      ...prev,
      estudianteEmail: email
    }));
    
    // Buscar automáticamente cuando el email parece completo
    if (email.includes('@') && email.length > 5) {
      buscarEstudiantePorEmail(email);
    } else {
      setStudentFound(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.fecha || !formData.horaInicio || !formData.horaFin || 
        !formData.materia || !formData.tema || !formData.estudianteNombre) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    if (formData.horaInicio >= formData.horaFin) {
      alert('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    // Verificar que la fecha no sea futura
    const fechaSeleccionada = new Date(formData.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada > hoy) {
      alert('No se pueden registrar asesorías futuras. Solo asesorías ya impartidas.');
      return;
    }

    setIsSubmitting(true);

    try {
      const asesoriaData = {
        professorId: user.professor.id,
        date: formData.fecha,
        timeSlot: `${formData.horaInicio}-${formData.horaFin}`,
        subject: formData.materia,
        topic: formData.tema,
        type: formData.tipoAsesoria,
        description: formData.descripcion,
        studentName: formData.estudianteNombre,
        studentEmail: formData.estudianteEmail || undefined,
        studentId: formData.studentId || undefined // Incluir studentId si se encontró
      };

      const response = await fetch(`${API_ENTRADAS_URL}/advisories/manual`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(asesoriaData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar la asesoría');
      }

      const result = await response.json();
      
      alert('Asesoría registrada exitosamente');
      
      // Limpiar formulario
      setFormData({
        fecha: '',
        horaInicio: '',
        horaFin: '',
        materia: '',
        tema: '',
        tipoAsesoria: 'individual',
        descripcion: '',
        estudianteNombre: '',
        estudianteEmail: '',
        studentId: null
      });
      setStudentFound(null);

    } catch (error) {
      console.error('Error registrando asesoría:', error);
      alert(`Error al registrar la asesoría: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-600 mb-8 flex items-center gap-3">
        <Icon name="PlusCircle" size={28} />
        Registrar Asesoría Impartida
      </h2>

      <Card
        header={
          <h5 className="text-xl font-bold flex items-center gap-2">
            <Icon name="BookOpen" size={20} />
            Datos de la Asesoría
          </h5>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Información básica */}
            <FormGroup
              label="Fecha de la Asesoría"
              icon="Calendar"
              type="date"
              value={formData.fecha}
              onChange={(e) => handleInputChange('fecha', e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
            />

            <FormGroup
              label="Tipo de Asesoría"
              icon="Users"
              type="select"
              value={formData.tipoAsesoria}
              onChange={(e) => handleInputChange('tipoAsesoria', e.target.value)}
              options={tiposAsesoria}
              required
            />

            <FormGroup
              label="Hora de Inicio"
              icon="Clock"
              type="select"
              value={formData.horaInicio}
              onChange={(e) => handleInputChange('horaInicio', e.target.value)}
              options={horas}
              placeholder="Seleccione hora de inicio"
              required
            />

            <FormGroup
              label="Hora de Fin"
              icon="Clock"
              type="select"
              value={formData.horaFin}
              onChange={(e) => handleInputChange('horaFin', e.target.value)}
              options={horas.slice(1)}
              placeholder="Seleccione hora de fin"
              required
            />

            <FormGroup
              label="Materia"
              icon="Book"
              type="text"
              value={formData.materia}
              onChange={(e) => handleInputChange('materia', e.target.value)}
              placeholder="Ej: Matemáticas, Física, Química..."
              required
            />

            <FormGroup
              label="Tema de la Asesoría"
              icon="FileText"
              type="text"
              value={formData.tema}
              onChange={(e) => handleInputChange('tema', e.target.value)}
              placeholder="Ej: Ecuaciones diferenciales, Cinemática..."
              required
            />

            <div className="relative">
              <FormGroup
                label="Email del Estudiante"
                icon="Mail"
                type="email"
                value={formData.estudianteEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="ejemplo@ids.upchiapas.edu.mx"
              />
              {isSearching && (
                <div className="absolute right-3 top-10 text-blue-500">
                  <Icon name="Loader" size={20} className="animate-spin" />
                </div>
              )}
              {studentFound && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <Icon name="CheckCircle" size={18} className="text-green-600" />
                  <span className="text-sm text-green-700">
                    Estudiante encontrado: <strong>{studentFound.nombre}</strong> (Matrícula: {studentFound.matricula})
                  </span>
                </div>
              )}
              {formData.estudianteEmail && !isSearching && !studentFound && formData.estudianteEmail.includes('@') && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                  <Icon name="AlertCircle" size={18} className="text-yellow-600" />
                  <span className="text-sm text-yellow-700">
                    Estudiante no encontrado en el sistema. Ingrese el nombre manualmente.
                  </span>
                </div>
              )}
            </div>

            <FormGroup
              label="Nombre del Estudiante"
              icon="User"
              type="text"
              value={formData.estudianteNombre}
              onChange={(e) => handleInputChange('estudianteNombre', e.target.value)}
              placeholder="Nombre completo del estudiante"
              required
              disabled={studentFound !== null}
            />
          </div>

          <FormGroup
            label="Descripción de la Asesoría"
            icon="MessageSquare"
            type="textarea"
            value={formData.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            placeholder="Describa brevemente los temas tratados, metodología utilizada, resultados obtenidos..."
            rows={4}
          />

          <div className="mt-8 text-sm text-gray-600 bg-yellow-50 p-4 rounded-lg mb-6">
            <Icon name="AlertTriangle" size={16} className="inline mr-2" />
            <strong>Importante:</strong>
            <ul className="mt-2 ml-4 list-disc">
              <li>Solo registre asesorías que ya hayan sido impartidas</li>
              <li>No se pueden registrar asesorías futuras</li>
              <li>Asegúrese de que toda la información sea correcta antes de enviar</li>
              <li>Esta asesoría se marcará automáticamente como completada</li>
            </ul>
          </div>

          <div className="flex justify-end gap-4">
            <CustomButton
              type="button"
              variant="secondary"
              icon="X"
              onClick={() => {
                if (window.confirm('¿Está seguro de que desea cancelar? Se perderán todos los datos ingresados.')) {
                  setFormData({
                    fecha: '',
                    horaInicio: '',
                    horaFin: '',
                    materia: '',
                    tema: '',
                    tipoAsesoria: 'individual',
                    descripcion: '',
                    estudianteNombre: '',
                    estudianteEmail: '',
                    studentId: null
                  });
                  setStudentFound(null);
                }
              }}
            >
              Cancelar
            </CustomButton>

            <CustomButton
              type="submit"
              variant="success"
              icon="Save"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Asesoría'}
            </CustomButton>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RegistrarAsesoriaImpartida;

