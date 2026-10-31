import { useAuth } from '../../context/AuthContext';
import { esAdministrador } from '../../utils/permissions';

type AdminAccessState = {
  verificando: boolean;
  autorizado: boolean;
  error: string;
};

export function useAdminAccess(): AdminAccessState {
  const { usuario, loading } = useAuth();
  const autorizado = esAdministrador(usuario);

  return {
    verificando: loading,
    autorizado,
    error: !loading && !autorizado
      ? 'No tenés permisos de administración.'
      : '',
  };
}
