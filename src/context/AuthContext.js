import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock Firebase functions that won't crash
  const mockFirebase = {
    auth: () => ({
      onAuthStateChanged: (callback) => {
        console.log('Mock: onAuthStateChanged called');
        // Simulate no user initially, then you can login
        callback(null);
        return () => {}; // Mock unsubscribe
      },
      signInWithEmailAndPassword: (email, password) => 
        Promise.resolve({ 
          user: { 
            uid: 'mock-uid', 
            email, 
            displayName: email.split('@')[0] 
          } 
        }),
      createUserWithEmailAndPassword: (email, password) => 
        Promise.resolve({ 
          user: { 
            uid: 'mock-uid', 
            email, 
            displayName: email.split('@')[0] 
          } 
        }),
      signOut: () => Promise.resolve()
    })
  };

  // Use mock Firebase for now
  const auth = mockFirebase.auth();

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        isAdmin: email === 'admin@adbeam.com'
      });
    } catch (error) {
      console.log('Login error (mock):', error);
      // For mock, always succeed
      setUser({
        uid: 'mock-uid',
        email: email,
        name: email.split('@')[0],
        isAdmin: email === 'admin@adbeam.com'
      });
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    setLoading(true);
    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        name: name,
        isAdmin: false
      });
    } catch (error) {
      console.log('Register error (mock):', error);
      // For mock, always succeed
      setUser({
        uid: 'mock-uid',
        email: email,
        name: name,
        isAdmin: false
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.log('Logout error (mock):', error);
    }
    setUser(null);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          isAdmin: firebaseUser.email === 'admin@adbeam.com'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};