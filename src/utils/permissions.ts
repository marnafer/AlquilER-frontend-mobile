import type { User } from '../types/user';

export function esAdministrador(usuario: User | null): boolean {
  return usuario?.rol_id === 2 || usuario?.rol?.id === 2;
}
