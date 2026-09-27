import { createContext, useContext, useState } from 'react';

const LayoutContext = createContext(null);

export function LayoutProvider({ children }) {
    const [bottomNavigationHeight, setBottomNavigationHeight] = useState(0);

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

export function useLayout() {
    const context = useContext(LayoutContext);

    if (!context) {
        throw new Error(
            'useLayout debe utilizarse dentro de LayoutProvider'
        );
    }

    return context;
}