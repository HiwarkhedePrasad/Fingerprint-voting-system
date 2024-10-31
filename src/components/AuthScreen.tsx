import React, { useState, useEffect } from 'react';
import { Fingerprint, Loader } from 'lucide-react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { socket } from '../services/socket';

const AuthScreen = ({ onAuthenticated }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async () => {
    try {
      setScanning(true);
      setError('');
      
      // Get fingerprint ID
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      
      // Send to server for verification
      socket.emit('verify_fingerprint', { fingerprintId: result.visitorId }, (response) => {
        if (response.success) {
          onAuthenticated(response.user);
        } else {
          setError(response.message || 'Authentication failed');
        }
        setScanning(false);
      });
    } catch (err) {
      setError('Failed to scan fingerprint');
      setScanning(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl mt-20">
      <div className="p-8">
        <div className="flex flex-col items-center">
          <div className={`p-6 rounded-full bg-amber-100 mb-6 ${scanning ? 'animate-pulse' : ''}`}>
            <Fingerprint size={48} className="text-amber-800" />
          </div>
          
          <h2 className="text-2xl font-bold text-amber-900 mb-4">
            Fingerprint Authentication
          </h2>
          
          <p className="text-amber-700 mb-6 text-center">
            Place your finger on the scanner to verify your identity
          </p>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <button
            onClick={handleScan}
            disabled={scanning}
            className="bg-amber-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-amber-900 transition-colors disabled:opacity-50"
          >
            {scanning ? (
              <>
                <Loader className="animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Fingerprint />
                Start Scan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;