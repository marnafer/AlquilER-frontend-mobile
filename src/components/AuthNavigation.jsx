import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '../context/AuthContext';

export default function AuthNavigation() {
    const router = useRouter();
    const pathname = usePathname();

    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (loading) {
            return;
        }

        const rutasPublicas = [
            '/home',
            '/login',
            '/register',
            '/properties',
        ];

        const esDetallePropiedad =
            /^\/property\/[^/]+$/.test(pathname);

        const esRutaPublica =
            rutasPublicas.includes(pathname) ||
            esDetallePropiedad;

        if (!isAuthenticated && !esRutaPublica) {
            router.replace('/home');
        }
    }, [
        isAuthenticated,
        loading,
        pathname,
        router,
    ]);

    return null;
}