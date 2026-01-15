import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FormGroup from '../molecules/FormGroup';
import CustomButton from '../atoms/CustomButton';
import Icon from '../atoms/Icon';

const Login = () => {
  const [userType, setUserType] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Si ya hay un usuario autenticado, redirigirlo a su dashboard
  useEffect(() => {
    if (user) {
      const routeMap = {
        'student': '/estudiante',
        'professor': '/profesor',
        'director': '/director',
        'encargado_criterio': '/director'
      };
      
      const route = routeMap[user.role] || '/estudiante';
      navigate(route, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      setIsLoading(false);
      return;
    }

    const result = await login(email, password, userType);
    
    if (result.success) {
      // Redirigir directamente basado en el tipo de usuario
      const routeMap = {
        'student': '/estudiante',
        'professor': '/profesor',
        'director': '/director',
        'encargado_criterio': '/director'
      };
      
      const route = routeMap[userType] || '/estudiante';
      navigate(route, { replace: true });
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden shimmer">
            <Icon name="GraduationCap" size={48} className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Sistema de Asesorías</h1>
            <p className="text-blue-100">Académicas</p>
          </div>
        </div>

        {/* User Type Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
            Selecciona tu tipo de usuario
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleUserTypeChange('student')}
              className={`
                flex-1 p-3 rounded-xl border-2 transition-all duration-300
                ${userType === 'student' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-blue-300'
                }
              `}
            >
              <Icon name="User" size={20} className="mx-auto mb-1" />
              <div className="font-semibold text-sm">Estudiante</div>
            </button>
            <button
              onClick={() => handleUserTypeChange('professor')}
              className={`
                flex-1 p-3 rounded-xl border-2 transition-all duration-300
                ${userType === 'professor' 
                  ? 'border-purple-500 bg-purple-50 text-purple-700' 
                  : 'border-gray-200 hover:border-purple-300'
                }
              `}
            >
              <Icon name="UserCheck" size={20} className="mx-auto mb-1" />
              <div className="font-semibold text-sm">Profesor</div>
            </button>
            <button
              onClick={() => handleUserTypeChange('director')}
              className={`
                flex-1 p-3 rounded-xl border-2 transition-all duration-300
                ${userType === 'director' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-200 hover:border-green-300'
                }
              `}
            >
              <Icon name="Crown" size={20} className="mx-auto mb-1" />
              <div className="font-semibold text-sm">Director</div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit}>
            <FormGroup
              label="Correo Electrónico"
              icon="Mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                userType === 'student' ? 'estudiante@universidad.edu' :
                userType === 'professor' ? 'profesor@universidad.edu' :
                'director@universidad.edu'
              }
              required
            />

            <FormGroup
              label="Contraseña"
              icon="Lock"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <Icon name="AlertCircle" size={16} />
                {error}
              </div>
            )}

            <CustomButton
              type="submit"
              variant="primary"
              size="lg"
              icon="LogIn"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </CustomButton>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Icon name="Info" size={16} />
              Credenciales de prueba:
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Estudiante:</strong> estudiante@universidad.edu / 123456</div>
              <div><strong>Profesor:</strong> profesor@universidad.edu / 123456</div>
              <div><strong>Director:</strong> director@universidad.edu / 123456</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

