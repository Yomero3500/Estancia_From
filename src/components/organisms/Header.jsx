// En: src/components/organisms/Header.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../atoms/Icon';
import CustomButton from '../atoms/CustomButton';

const Header = () => {
  const { user, logout } = useAuth();

  const getHomeUrl = () => {
    if (!user) return 'http://localhost:5173/login';
    
    switch (user.role) {
      case 'professor':
        return 'http://localhost:5173/docente/home';
      case 'student':
        return 'http://localhost:5173/alumno/home';
      case 'director':
        return 'http://localhost:5173/director/home';
      case 'encargado_criterio':
        return 'http://localhost:5173/encargado/home';
      default:
        return 'http://localhost:5173/login';
    }
  };

  const renderUserInfo = () => {
    if (!user) return null;

    if (user.role === 'student') {
      // Obtener matrícula - el backend devuelve el id como matrícula
      const matricula = user.student?.studentCode || 
                       user.id || 
                       'Sin Matrícula';
      
      // El nombre viene directamente en user.name
      const nombre = user.name || 'Sin Nombre';
      
      // Obtener cuatrimestre si existe
      const cuatrimestre = user.student?.semester ? `${user.student.semester}º Cuatrimestre` : '';
      
      const displayText = cuatrimestre 
        ? `${matricula} - ${nombre} (${cuatrimestre})`
        : `${matricula} - ${nombre}`;

      return (
        <>
          <Icon name="User" size={20} />
          <span className="font-medium text-lg" style={{ color: 'var(--color-white)' }}>
            {displayText}
          </span>
        </>
      );
    }

    const roleName = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    const displayName = `${roleName}: ${user.name || user.nombre || ''}`;

    return (
      <>
        <Icon name="UserCheck" size={20} />
        <span className="font-medium text-lg" style={{ color: 'var(--color-white)' }}>
          {displayName}
        </span>
      </>
    );
  };

  return (
    <header
      style={{
        background: 'var(--color-dark-bg)',
        color: 'var(--color-white)',
        boxShadow: '0 8px 32px 0 rgba(25, 118, 210, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="py-10 text-center"
    >
      <Icon name="GraduationCap" size={48} className="mx-auto mb-6" />
      <h1
        className="text-5xl font-bold mb-6 text-shadow"
        style={{ color: 'var(--color-primary)' }}
      >
        Sistema de Asesorías Académicas
      </h1>
      
      <div className="flex items-center justify-center gap-4 mb-6">
        <div
          style={{
            background: 'var(--color-secondary)', // Fondo secundario oscuro
            borderRadius: '9999px',
            padding: '0.75rem 1.5rem',
            border: '1px solid var(--color-gray-light)'
          }}
          className=""
        >
          <div className="flex items-center gap-3">
            {renderUserInfo()}
          </div>
        </div>
        
        <CustomButton
          variant="secondary"
          size="sm"
          icon="Home"
          onClick={() => window.location.href = getHomeUrl()}
          className=""
          style={{
            background: 'var(--color-secondary)',
            border: '1px solid var(--color-gray-light)',
            color: 'var(--color-white)'
          }}
        >
          Inicio
        </CustomButton>
        
        <CustomButton
          variant="secondary"
          size="sm"
          icon="LogOut"
          onClick={logout}
          className=""
          style={{
            background: 'var(--color-secondary)',
            border: '1px solid var(--color-gray-light)',
            color: 'var(--color-white)'
          }}
        >
          Cerrar Sesión
        </CustomButton>
      </div>
    </header>
  );
};

export default Header;
