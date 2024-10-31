import React, { useState, useEffect } from 'react';
import { Fingerprint, Vote, UserCheck, Settings } from 'lucide-react';
import Navbar from './components/Navbar';
import VotingArea from './components/VotingArea';
import AuthScreen from './components/AuthScreen';
import AdminPanel from './components/AdminPanel';
import { socket } from './services/socket';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    socket.on('auth_success', (userData) => {
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(userData.role === 'admin');
    });

    return () => {
      socket.off('auth_success');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <Navbar 
        isAuthenticated={isAuthenticated} 
        isAdmin={isAdmin}
        user={user}
        onLogout={() => setIsAuthenticated(false)}
      />
      
      <main className="container mx-auto px-4 py-8">
        {!isAuthenticated ? (
          <AuthScreen onAuthenticated={(userData) => {
            setUser(userData);
            setIsAuthenticated(true);
            setIsAdmin(userData.role === 'admin');
          }} />
        ) : isAdmin ? (
          <AdminPanel />
        ) : (
          <VotingArea user={user} />
        )}
      </main>
    </div>
  );
}

export default App;