import {
    createContext,
    useContext,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from 'react';

type LayoutContextValue = {
  bottomNavigationHeight: number;
  setBottomNavigationHeight: Dispatch<SetStateAction<number>>;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

type LayoutProviderProps = {
  children: ReactNode;
};

export function LayoutProvider({ children }: LayoutProviderProps) {
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

export function useLayout(): LayoutContextValue {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error('useLayout debe utilizarse dentro de LayoutProvider');
  }

  return context;
}