import React, { useState, useEffect } from 'react';
import { Users, PieChart, Settings, AlertCircle } from 'lucide-react';
import { socket } from '../services/socket';

const AdminPanel = () => {
  const [stats, setStats] = useState({
    totalVoters: 0,
    votesCount: 0,
    candidates: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    socket.emit('get_voting_stats', (response) => {
      if (response.success) {
        setStats(response.stats);
      } else {
        setError('Failed to load statistics');
      }
      setLoading(false);
    });

    // Listen for real-time updates
    socket.on('stats_update', (newStats) => {
      setStats(newStats);
    });

    return () => {
      socket.off('stats_update');
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-amber-900 mb-8">Admin Dashboard</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <Users className="text-amber-800" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-amber-900">Total Voters</h3>
          </div>
          <p className="text-3xl font-bold text-amber-800">{stats.totalVoters}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <PieChart className="text-amber-800" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-amber-900">Total Votes</h3>
          </div>
          <p className="text-3xl font-bold text-amber-800">{stats.votesCount}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <Settings className="text-amber-800" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-amber-900">Voting Status</h3>
          </div>
          <p className="text-xl font-semibold text-green-600">Active</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-amber-900 mb-6">Candidate Results</h3>
        <div className="space-y-4">
          {stats.candidates.map((candidate) => (
            <div key={candidate.id} className="border-b border-amber-100 pb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-amber-900">{candidate.name}</span>
                <span className="text-amber-800">{candidate.votes} votes</span>
              </div>
              <div className="w-full bg-amber-100 rounded-full h-2.5">
                <div 
                  className="bg-amber-800 h-2.5 rounded-full"
                  style={{ width: `${(candidate.votes / stats.votesCount * 100) || 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;