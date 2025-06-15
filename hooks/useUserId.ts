import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';

/**
 * Hook pour obtenir un identifiant utilisateur robuste (user.id, anonId, ou 'default').
 * Centralise la logique d'identification pour toute l'app.
 */
export function useUserId() {
  const { user, anonId } = useAuth();
  const [userId, setUserId] = useState('default');

  useEffect(() => {
    if (user && user.id) {
      setUserId(user.id);
    } else if (anonId) {
      setUserId(anonId);
    } else {
      setUserId('default');
    }
  }, [user, anonId]);

  return userId;
}
