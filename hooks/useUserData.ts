import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { User } from '../types/user';

export function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error);
        setUser(data);
      });
  }, [userId]);

  return user;
}