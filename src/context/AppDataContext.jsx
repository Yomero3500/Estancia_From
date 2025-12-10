import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AppDataContext = createContext();

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData debe ser usado dentro de un AppDataProvider');
  return context;
};

export const AppDataProvider = ({ children }) => {
  const { getAuthHeaders, user } = useAuth();
  // URL base para asesorías y datos académicos (puerto 3002)
  const API_BASE_URL = 'http://localhost:3002';
  // URL base para datos de docentes (puerto 3001)
  const API_DOCENTES_URL = 'http://localhost:3001';

  const API_ENTRADAS_URL = 'http://localhost:5000/api';
  const [solicitudes, setSolicitudes] = useState([]);
  const [horarios, setHorarios] = useState({});
  const [profesores, setProfesores] = useState([]);

  useEffect(() => {
    // Si no hay usuario, no hacemos nada.
    if (!user) return;

    const userRole = user.role;

    const fetchHorarios = async () => {
      // Para profesores, nos aseguramos de que el perfil de profesor exista antes de continuar.
      if (userRole === 'professor' && user.professor?.id) {
        try {
          const professorId = user.professor.id;
          const res = await fetch(`${API_ENTRADAS_URL}/schedules/my-schedules?professorId=${professorId}`, {
            headers: getAuthHeaders(),
          });
          if (!res.ok) throw new Error(`Error al cargar horarios: ${res.status}`);
          const result = await res.json();
          const normalized = {
            [professorId]: (result.data || []).map(h => ({
              id: h.id,
              dayOfWeek: h.dayOfWeek,
              startTime: h.startTime.slice(0, 5),
              endTime: h.endTime.slice(0, 5),
              isAvailable: h.isAvailable,
            }))
          };
          setHorarios(normalized);
        } catch (err) {
          console.error('No se pudieron cargar los horarios:', err.message);
        }
      }
    };

    const fetchSolicitudes = async () => {
      try {
        let url = null;
        if (userRole === 'student' && user.student?.id) {
          url = `${API_ENTRADAS_URL}/advisories/student/${user.student.id}`;
        } else if (userRole === 'professor' && user.professor?.id) {
          url = `${API_ENTRADAS_URL}/advisories/professor/${user.professor.id}`;
        } else if (userRole === 'director') {
          // El director necesita el historial completo con toda la información
          url = `${API_ENTRADAS_URL}/advisories/history/director`; 
        }
        
        if (!url) {
          console.log('❌ No se generó URL para solicitudes. User:', user);
          return; // Si no hay URL, no hacemos la llamada.
        }

        console.log('🔵 Cargando solicitudes desde:', url);
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Error al cargar solicitudes: ${res.status}`);
        const data = await res.json();
        console.log('✅ Solicitudes recibidas del backend:', data);
        
        // Procesamos las solicitudes para asegurar que tengan toda la información necesaria
        const solicitudesProcesadas = (data.data || []).map(solicitud => {
          // Múltiples formas de obtener la matrícula del estudiante
          let studentMatricula = 'N/A';
          
          // Intentamos obtener la matrícula de diferentes lugares posibles
          if (solicitud.student?.studentCode) {
            studentMatricula = solicitud.student.studentCode; // <- ESTA ES LA CORRECTA
          } else if (solicitud.student?.matricula) {
            studentMatricula = solicitud.student.matricula;
          } else if (solicitud.student?.user?.matricula) {
            studentMatricula = solicitud.student.user.matricula;
          } else if (solicitud.studentMatricula) {
            studentMatricula = solicitud.studentMatricula;
          } else if (solicitud.student?.enrollment) {
            studentMatricula = solicitud.student.enrollment;
          } else if (solicitud.student?.id) {
            // Como último recurso, usamos el ID del estudiante
            studentMatricula = `EST-${solicitud.student.id}`;
          }

          // Buscar el nombre del profesor en el array de profesores cargados
          let professorName = 'No asignado';
          if (solicitud.professor?.user?.name) {
            professorName = solicitud.professor.user.name;
          } else if (solicitud.professorName) {
            professorName = solicitud.professorName;
          } else if (solicitud.professorId) {
            // Buscar en el array de profesores por ID
            const profesor = profesores.find(p => p.id === solicitud.professorId);
            if (profesor) {
              professorName = profesor.name;
            }
          }

          return {
            ...solicitud,
            // Normalizamos la matrícula del estudiante
            studentMatricula: studentMatricula,
            // Aseguramos que tenga las observaciones
            observations: solicitud.observations || solicitud.observaciones || solicitud.description || solicitud.rejectionReason || '',
            // Mantenemos compatibilidad con nombres anteriores
            studentName: solicitud.student?.user?.name || solicitud.studentName,
            professorName: professorName,
          };
        });
        
        console.log('✅ Solicitudes procesadas:', solicitudesProcesadas.length, 'solicitudes');
        console.log('📋 Detalle de solicitudes:', solicitudesProcesadas.map(s => ({ 
          id: s.id,
          studentId: s.studentId,
          status: s.status,
          studentName: s.studentName, 
          matricula: s.studentMatricula 
        })));
        
        setSolicitudes(solicitudesProcesadas);
      } catch (err) {
        console.error('No se pudieron cargar las solicitudes:', err);
      }
    };

    const fetchProfesores = async () => {
      try {
        console.log('🔵 Cargando profesores desde:', `${API_DOCENTES_URL}/usuarios/profesores/listar`);
        const res = await fetch(`${API_DOCENTES_URL}/usuarios/profesores/listar`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error(`Error al cargar profesores: ${res.status}`);
        const data = await res.json();
        console.log('✅ Profesores recibidos del backend:', data);
        // Mapear la estructura del backend: { id, nombre, tipo, email, telefono, estado }
        // A la estructura esperada por la app: { id, name }
        const profesoresMapeados = (data || []).map(profesor => ({
          id: profesor.id,
          name: profesor.nombre,
          email: profesor.email,
          telefono: profesor.telefono,
          estado: profesor.estado,
          tipo: profesor.tipo
        }));
        console.log('✅ Profesores mapeados:', profesoresMapeados);
        setProfesores(profesoresMapeados);
      } catch (err) {
        console.error('No se pudieron cargar los profesores:', err);
      }
    };

    // Ejecutamos las cargas de datos.
    // Primero cargamos profesores, luego horarios y solicitudes
    const loadData = async () => {
      await fetchProfesores();
      fetchHorarios();
      fetchSolicitudes();
    };
    
    loadData();

  }, [user, API_BASE_URL, API_DOCENTES_URL, getAuthHeaders]);

  // Guardar en localStorage (sin cambios)
  useEffect(() => localStorage.setItem('solicitudes', JSON.stringify(solicitudes)), [solicitudes]);
  useEffect(() => localStorage.setItem('horarios', JSON.stringify(horarios)), [horarios]);
  useEffect(() => localStorage.setItem('profesores', JSON.stringify(profesores)), [profesores]);

  // Funciones CRUD
  const agregarSolicitud = async (solicitud) => {
    try {
      console.log('🔵 Enviando solicitud a:', `${API_ENTRADAS_URL}/advisories`);
      console.log('📤 Datos enviados:', solicitud);
      const res = await fetch(`${API_ENTRADAS_URL}/advisories`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(solicitud),
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Error al enviar solicitud:', res.status, errorData);
        throw new Error(`Error al enviar la solicitud: ${res.status}`);
      }
      const nuevaSolicitud = await res.json();
      console.log('✅ Solicitud creada exitosamente:', nuevaSolicitud);
      
      // Procesamos la nueva solicitud para incluir la información completa
      // Buscar el nombre del profesor en el array de profesores
      let professorName = 'No asignado';
      if (nuevaSolicitud.professor?.user?.name) {
        professorName = nuevaSolicitud.professor.user.name;
      } else if (nuevaSolicitud.professorId) {
        const profesor = profesores.find(p => p.id === nuevaSolicitud.professorId);
        if (profesor) {
          professorName = profesor.name;
        }
      }

      const solicitudProcesada = {
        ...nuevaSolicitud,
        studentMatricula: nuevaSolicitud.student?.matricula || 'N/A',
        observations: nuevaSolicitud.observations || '',
        studentName: nuevaSolicitud.student?.user?.name,
        professorName: professorName,
      };
      
      setSolicitudes(prev => [...prev, solicitudProcesada]);
      return { success: true, message: 'Solicitud enviada correctamente' };
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      return { success: false, message: err.message || 'Error desconocido' };
    }
  };

  const actualizarSolicitud = async (id, updates) => {
    try {
      const res = await fetch(`${API_ENTRADAS_URL}/advisories/${id}/status`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al actualizar la solicitud');
      }

      const { data: updatedAdvisoryFromServer } = await res.json();

      setSolicitudes(prevSolicitudes =>
        prevSolicitudes.map(solicitud => {
          if (solicitud.id !== id) {
            return solicitud;
          }

          // Fusionamos la información manteniendo la matrícula y observaciones
          return {
            ...solicitud, // Mantiene `student`, `professor`, `studentMatricula`, `observations`
            ...updatedAdvisoryFromServer, // Actualiza `status`, `date`, `timeSlot`, etc.
            // Re-procesamos la información para mantener consistencia
            studentMatricula: updatedAdvisoryFromServer.student?.matricula || solicitud.studentMatricula || 'N/A',
            observations: updatedAdvisoryFromServer.observations || solicitud.observations || '',
          };
        })
      );

      return { success: true, data: updatedAdvisoryFromServer };

    } catch (err) {
      console.error('Error al actualizar la solicitud:', err);
      return { success: false, message: err.message };
    }
  };

  const agregarHorario = async (professorId, horario) => {
    try {
      if (!horario.dayOfWeek) throw new Error("El campo 'dayOfWeek' es requerido");

      const res = await fetch(`${API_ENTRADAS_URL}/schedules`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professorId,
          dayOfWeek: horario.dayOfWeek.toLowerCase(),
          startTime: horario.startTime,
          endTime: horario.endTime,
          isAvailable: horario.isAvailable ?? true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al agregar horario');
      }

      const { data: nuevoHorario } = await res.json();
      setHorarios(prev => ({
        ...prev,
        [professorId]: [
          ...(prev[professorId] || []),
          {
            id: nuevoHorario.id,
            dayOfWeek: nuevoHorario.dayOfWeek,
            startTime: nuevoHorario.startTime.slice(0, 5),
            endTime: nuevoHorario.endTime.slice(0, 5),
            isAvailable: nuevoHorario.isAvailable,
          }
        ],
      }));

    } catch (err) {
      console.error('No se pudo agregar horario:', err);
    }
  };

  const eliminarHorario = async (professorId, scheduleId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar horario');
      }

      setHorarios(prev => ({
        ...prev,
        [professorId]: prev[professorId].filter(h => h.id !== scheduleId),
      }));
    } catch (err) {
      console.error('No se pudo eliminar horario:', err);
    }
  };

  const toggleDisponibilidadHorario = async (professorId, scheduleId) => {
    try {
      const current = horarios[professorId]?.find(h => h.id === scheduleId);
      if (!current) return;

      const newAvailability = !current.isAvailable;
      const res = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/availability`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newAvailability }),
      });

      if (!res.ok) throw new Error(`Error al actualizar disponibilidad: ${res.status}`);

      setHorarios(prev => ({
        ...prev,
        [professorId]: prev[professorId].map(h =>
          h.id === scheduleId ? { ...h, isAvailable: newAvailability } : h
        ),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const generarHorariosDisponibles = async (professorId, date) => {
    try {
      const url = `${API_ENTRADAS_URL}/schedules/available/${professorId}/${date}`;
      console.log('🔵 Obteniendo horarios disponibles desde:', url);
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        console.error('❌ Error al obtener horarios:', res.status);
        throw new Error(`Error al obtener horarios disponibles: ${res.status}`);
      }
      const result = await res.json();
      console.log('✅ Horarios disponibles recibidos:', result);
      
      // La respuesta tiene la estructura: { success: true, message: "...", data: [...] }
      return result.data || [];
    } catch (err) {
      console.error('Error al obtener horarios disponibles:', err);
      return [];
    }
  };

  const value = {
    solicitudes,
    horarios,
    profesores,
    agregarSolicitud,
    actualizarSolicitud,
    agregarHorario,
    eliminarHorario,
    toggleDisponibilidadHorario,
    generarHorariosDisponibles,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};