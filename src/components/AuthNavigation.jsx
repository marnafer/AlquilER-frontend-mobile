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
    ]);

    return null;
}