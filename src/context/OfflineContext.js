import React, { createContext, useState, useContext } from 'react';

const OfflineContext = createContext({
    isOffline: false,
    setOffline: () => {},
});

export const useOffline = () => {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within an OfflineProvider');
    }
    return context;
};

export const OfflineProvider = ({ children }) => {
    const [isOffline, setIsOffline] = useState(false);

    const setOffline = (offline) => {
        setIsOffline(offline);
    };

    const value = {
        isOffline,
        setOffline,
    };

    return (
        <OfflineContext.Provider value={value}>
            {children}
        </OfflineContext.Provider>
    );
};
