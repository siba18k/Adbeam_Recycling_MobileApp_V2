// Mock offline storage service
export const OfflineStorageService = {
  getUser: () => Promise.resolve(null),
  saveUser: (userData) => Promise.resolve(),
  getScans: () => Promise.resolve([]),
  saveScan: (scanData) => Promise.resolve(),
  syncData: () => Promise.resolve()
};