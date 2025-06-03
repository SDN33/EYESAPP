import { useEffect, useState } from "react";
import { getUser } from "../services/auth";

export function useUserData() {
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  return user;
}
