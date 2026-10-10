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
            '/propiedades',
            '/register',
            '/ayuda',
            '/contacto',
            '/preguntas-frecuentes',
            '/privacidad',
            '/servicios',
            '/terminos',
        ];

        if (
            !isAuthenticated &&
            !rutasPublicas.includes(pathname)
        ) {
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