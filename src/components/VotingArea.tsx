import React, { useState, useEffect } from 'react';
import { Vote, Check, AlertCircle } from 'lucide-react';
import { socket } from '../services/socket';

const VotingArea = ({ user }) => {
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    socket.emit('get_candidates', (response) => {
      if (response.success) {
        setCandidates(response.candidates);
      } else {
        setError('Failed to load candidates');
      }
      setLoading(false);
    });

    socket.emit('check_vote_status', { userId: user.id }, (response) => {
      setHasVoted(response.hasVoted);
    });
  }, [user]);

  const handleVote = (candidateId) => {
    setLoading(true);
    socket.emit('cast_vote', { 
      userId: user.id, 
      candidateId,
      fingerprintId: user.fingerprintId 
    }, (response) => {
      setLoading(false);
      if (response.success) {
        setSuccess('Your vote has been recorded successfully!');
        setHasVoted(true);
      } else {
        setError(response.message || 'Failed to cast vote');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <Check size={48} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-amber-900 mb-4">Thank You!</h2>
        <p className="text-amber-700">Your vote has been recorded successfully.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-amber-900 mb-8 text-center">Cast Your Vote</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 flex items-center gap-2">
          <Check size={20} />
          {success}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <img 
              src={candidate.image} 
              alt={candidate.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-bold text-amber-900 mb-2">{candidate.name}</h3>
              <p className="text-amber-700 mb-4">{candidate.party}</p>
              <button
                onClick={() => handleVote(candidate.id)}
                disabled={loading}
                className="w-full bg-amber-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-amber-900 transition-colors disabled:opacity-50"
              >
                <Vote size={20} />
                Vote
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VotingArea;