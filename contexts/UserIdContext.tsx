import React, { createContext, useContext } from 'react';

export const UserIdContext = createContext<{ anonId: string }>({ anonId: '' });

export function useUserIdContext() {
  return useContext(UserIdContext);
}
