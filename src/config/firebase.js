// Placeholder Firebase config - we'll implement real Firebase later
export const firebaseConfig = {
  apiKey: "mock-api-key",
  authDomain: "mock-project.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "mock-app-id"
};

// Mock Firebase initialization
export const initializeFirebase = () => {
  console.log('Firebase initialized (mock)');
  return {
    auth: () => ({}),
    firestore: () => ({})
  };
};

// Mock AsyncStorage functions
export const AsyncStorage = {
  setItem: async (key, value) => {
    console.log(`Mock AsyncStorage: Setting ${key}`);
    return Promise.resolve();
  },
  getItem: async (key) => {
    console.log(`Mock AsyncStorage: Getting ${key}`);
    return Promise.resolve(null);
  },
  removeItem: async (key) => {
    console.log(`Mock AsyncStorage: Removing ${key}`);
    return Promise.resolve();
  }
};