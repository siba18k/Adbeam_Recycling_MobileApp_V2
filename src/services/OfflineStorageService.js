import React, { createContext, useContext, useState, useEffect } from 'react';
import { OfflineStorageService } from './MockOfflineStorageService';

const OfflineContext = createContext();

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState([]);

  const syncOfflineData = async () => {
    console.log('Syncing offline data (mock)...');
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 1000));
    setOfflineData([]);
    return { success: true, message: 'Data synced successfully' };
  };

  const addOfflineData = (data) => {
    setOfflineData(prev => [...prev, { ...data, id: Date.now(), synced: false }]);
  };

  const getUserData = async () => {
    try {
      return await OfflineStorageService.getUser();
    } catch (error) {
      console.log('Mock: Error getting user data', error);
      return null;
    }
  };

  useEffect(() => {
    // Mock online/offline detection
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.2); // 80% chance of being online
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    isOnline,
    offlineData,
    syncOfflineData,
    addOfflineData,
    getUserData
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