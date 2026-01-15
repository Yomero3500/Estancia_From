import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook personalizado para transferir datos de sessionStorage a localStorage
 * Se ejecuta al cargar la página y verifica si hay datos de autenticación
 */
export const useSessionTransfer = () => {
  const [transferStatus, setTransferStatus] = useState({
    loading: true,
    success: false,
    error: null
  });
  const navigate = useNavigate();

  useEffect(() => {
    const transferData = () => {
      try {
        console.log('🔍 Verificando datos en sessionStorage...');

        // Obtener datos del sessionStorage
        const sessionUser = sessionStorage.getItem('user');
        const sessionToken = sessionStorage.getItem('token');
        const sessionUserID = sessionStorage.getItem('userID');

        console.log('📦 Datos encontrados en sessionStorage:', {
          user: sessionUser ? 'Presente' : 'No encontrado',
          token: sessionToken ? 'Presente' : 'No encontrado',
          userID: sessionUserID ? 'Presente' : 'No encontrado'
        });

        // Variable para saber si necesitamos recargar
        let needsReload = false;

        // Si hay datos en sessionStorage, transferirlos a localStorage
        if (sessionUser && sessionToken) {
          console.log('💾 Transfiriendo datos de sessionStorage a localStorage...');
          needsReload = true; // Marcar que necesitamos recargar

          // Parsear el usuario para validarlo
          let userObject;
          try {
            userObject = JSON.parse(sessionUser);
          } catch (parseError) {
            console.error('❌ Error al parsear el objeto user:', parseError);
            setTransferStatus({
              loading: false,
              success: false,
              error: 'Datos de usuario inválidos'
            });
            return;
          }

          // Validar estructura del objeto user
          if (!userObject.id || !userObject.email || !userObject.role) {
            console.error('❌ Estructura de usuario incompleta:', userObject);
            setTransferStatus({
              loading: false,
              success: false,
              error: 'Datos de usuario incompletos'
            });
            return;
          }

          // Guardar en localStorage
          localStorage.setItem('user', sessionUser);
          localStorage.setItem('token', sessionToken);
          if (sessionUserID) {
            localStorage.setItem('userID', sessionUserID);
          }
          localStorage.setItem('userType', userObject.role);

          // Limpiar sessionStorage después de transferir
          console.log('🧹 Limpiando sessionStorage...');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('userID');

          console.log('✅ Datos transferidos de sessionStorage a localStorage');
        } else {
          // Si no hay datos en sessionStorage, verificar localStorage
          console.log('🔍 No hay datos en sessionStorage, verificando localStorage...');
          
          const localUser = localStorage.getItem('user');
          const localToken = localStorage.getItem('token');
          const localUserID = localStorage.getItem('userID');

          console.log('📦 Datos encontrados en localStorage:', {
            user: localUser ? 'Presente' : 'No encontrado',
            token: localToken ? 'Presente' : 'No encontrado',
            userID: localUserID ? 'Presente' : 'No encontrado'
          });

          // Verificar que al menos tengamos user y token en localStorage
          if (!localUser || !localToken) {
            console.warn('⚠️ No se encontraron datos completos en sessionStorage ni localStorage');
            setTransferStatus({
              loading: false,
              success: false,
              error: 'No se encontraron datos de autenticación en sessionStorage'
            });
            return;
          }

          // Parsear el usuario para validarlo
          let userObject;
          try {
            userObject = JSON.parse(localUser);
          } catch (parseError) {
            console.error('❌ Error al parsear el objeto user:', parseError);
            setTransferStatus({
              loading: false,
              success: false,
              error: 'Datos de usuario inválidos'
            });
            return;
          }

          // Validar estructura del objeto user
          if (!userObject.id || !userObject.email || !userObject.role) {
            console.error('❌ Estructura de usuario incompleta:', userObject);
            setTransferStatus({
              loading: false,
              success: false,
              error: 'Datos de usuario incompletos'
            });
            return;
          }

          console.log('✅ Datos ya presentes en localStorage, no se requiere recarga');
        }

        setTransferStatus({
          loading: false,
          success: true,
          error: null
        });

        // Solo recargar si transferimos datos de sessionStorage
        if (needsReload) {
          console.log('🔄 Recargando página para aplicar autenticación...');
          window.location.reload();
        }

      } catch (error) {
        console.error('❌ Error en transferencia de datos:', error);
        setTransferStatus({
          loading: false,
          success: false,
          error: error.message || 'Error desconocido al transferir datos'
        });
      }
    };

    transferData();
  }, []); // Solo se ejecuta una vez al montar el componente

  return transferStatus;
};
