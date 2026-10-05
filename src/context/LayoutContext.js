import {
    createContext,
    useContext,
    useState,
} from 'react';

/**
 * @typedef {Object} LayoutContextType
 * @property {number} bottomNavigationHeight
 * @property {import('react').Dispatch<import('react').SetStateAction<number>>} setBottomNavigationHeight
 */

/** @type {import('react').Context<LayoutContextType | null>} */
const LayoutContext = createContext(null);

export function LayoutProvider({ children }) {
    const [
        bottomNavigationHeight,
        setBottomNavigationHeight,
    ] = useState(0);

    return (
        <LayoutContext.Provider
            value={{
                bottomNavigationHeight,
                setBottomNavigationHeight,
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
}

/**
 * @returns {LayoutContextType}
 */
export function useLayout() {
    const context = useContext(LayoutContext);

    if (!context) {
        throw new Error(
            'useLayout debe utilizarse dentro de LayoutProvider'
        );
    }

    return context;
}