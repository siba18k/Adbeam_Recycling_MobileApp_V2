import React, { createContext, useContext } from 'react';

const OfflineContext = createContext();

export const OfflineProvider = ({ children }) => {
  const value = {
    // Placeholder values
    isOnline: true,
    syncData: () => Promise.resolve(),
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};