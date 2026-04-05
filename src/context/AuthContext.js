import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('access_token');
    const role  = localStorage.getItem('user_role');
    const name  = localStorage.getItem('user_name');
    const username  = localStorage.getItem('user_username');

    return token ? { role, name, username} : null;
  });

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password });

    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    // Decode JWT
    const payload = JSON.parse(atob(data.access.split('.')[1]));
    const role = payload.role ?? 'viewer';
    const name = payload.name ?? 'User';
    const usernameme = payload.username ?? 'User';

    // ✅ store both
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_name', name);
    localStorage.setItem('user_username', usernameme);

    // ✅ update state
    setUser({ role, name , usernameme});
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);