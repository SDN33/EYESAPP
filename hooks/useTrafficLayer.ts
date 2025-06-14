// hooks/useTrafficLayer.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'settings:showTrafficLayer';

export function useTrafficLayer(): [boolean, (v: boolean) => void, boolean] {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val === 'false') setEnabled(false);
      else setEnabled(true);
      setLoading(false);
    });
  }, []);

  const setAndPersist = (v: boolean) => {
    setEnabled(v);
    AsyncStorage.setItem(STORAGE_KEY, v ? 'true' : 'false');
  };

  return [enabled, setAndPersist, loading];
}
