import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // URL base de la API
  const API_BASE_URL = 'http://localhost:3002';
  const API_DOCENTES_URL = 'http://localhost:3001';
  const API_ENTRADAS_URL = 'http://localhost:5000/api';

  useEffect(() => {
    // Cargar usuario de localStorage cuando se monta el componente
    const savedUser = localStorage.getItem("user");
    const savedUserType = localStorage.getItem("userType");
    
    if (savedUser && savedUserType) {
      try {
        setUser(JSON.parse(savedUser));
        setUserType(savedUserType);
      } catch (error) {
        console.error('Error al cargar usuario guardado:', error);
        localStorage.removeItem("user");
        localStorage.removeItem("userType");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password, type) => {
    try {
      setIsLoading(true);
      
      // Mapear tipo de usuario a endpoint específico
      const endpointMap = {
        'student': '/alumnos/login',
        'professor': '/usuarios/login',
        'director': '/usuarios/login',
        'encargado_criterio': '/encargados-criterio/login'
      };

      const endpoint = endpointMap[type];
      if (!endpoint) {
        return {
          success: false,
          error: 'Tipo de usuario no válido'
        };
      }

      const baseUrl = (type === 'professor' || type === 'director') ? API_DOCENTES_URL : API_BASE_URL;

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Para profesores y directores, la respuesta es { user: {...}, message: "..." }
        // Para estudiantes, puede ser { success: true, data: {...} }
        const responseData = data.user || data.data || data;
        
        // Normalizar la estructura del usuario según el endpoint
        let loggedInUser;
        let token;

        // Los endpoints de alumnos devuelven: id, name, email, estatus, tutor_academico_id, cohorte_id
        if (type === 'student') {
          loggedInUser = {
            id: responseData.id,
            email: responseData.email,
            name: responseData.name, // El backend devuelve "name", no "nombre"
            role: 'student',
            student: {
              id: responseData.id,
              studentCode: responseData.id, // La matrícula es el id del estudiante
              status: responseData.estatus,
              cohortId: responseData.cohorte_id,
              tutorId: responseData.tutor_academico_id
            }
          };
          token = data.token; // El token viene en el nivel superior de data
        } else if (type === 'professor') {
          // Para profesores
          loggedInUser = {
            id: responseData.id,
            email: responseData.email,
            name: responseData.nombre,
            role: 'professor',
            professor: {
              id: responseData.id,
              name: responseData.nombre,
              email: responseData.email,
              telefono: responseData.telefono,
              estado: responseData.estado,
              roles: responseData.roles
            }
          };
          token = responseData.token || data.token || 'default_token';
        } else {
          // Para directores y encargados
          loggedInUser = responseData.user || responseData;
          token = responseData.token || data.token;
          
          // Si no tiene role definido, asignarlo
          if (!loggedInUser.role) {
            loggedInUser.role = type;
          }
        }

        // Verificar que el tipo de usuario coincida
        if (loggedInUser.role !== type) {
          return { 
            success: false, 
            error: 'Tipo de usuario incorrecto. Verifica tu selección.' 
          };
        }

        setUser(loggedInUser);
        setUserType(loggedInUser.role);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        localStorage.setItem("userType", loggedInUser.role);
        localStorage.setItem("token", token);

        // Mostrar en consola lo guardado en localStorage
        console.log('=== DATOS GUARDADOS EN LOCALSTORAGE ===');
        console.log('user:', JSON.parse(localStorage.getItem("user")));
        console.log('userType:', localStorage.getItem("userType"));
        console.log('token:', localStorage.getItem("token"));
        console.log('========================================');

        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.message || 'Credenciales incorrectas' 
        };
      }
    } catch (error) {
      console.error('Error durante el login:', error);
      return { 
        success: false, 
        error: 'Error de conexión con el servidor. Verifica que el backend esté ejecutándose.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setUserType(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('token');
    localStorage.removeItem('userID');
    
    // Redirigir al login externo
    window.location.href = 'http://localhost:5173/login';
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    } : {
      'Content-Type': 'application/json',
    };
  };

  const value = {
    user,
    userType,
    isLoading,
    login,
    logout,
    getAuthHeaders,
    isAuthenticated: !!user,
    isStudent: user?.role === 'student',
    isProfesor: user?.role === 'professor',
    isDirector: user?.role === 'director',
    API_ENTRADAS_URL
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

