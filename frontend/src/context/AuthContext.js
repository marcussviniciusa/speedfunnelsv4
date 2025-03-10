import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verifica se existe um token válido no localStorage
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Verifica se o token está expirado
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // Token expirado
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setCurrentUser(null);
          } else {
            // Configura o axios com o token
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Carrega os dados do usuário
            const response = await axios.get('/api/auth/me');
            setCurrentUser(response.data);
            setIsAuthenticated(true);
          }
        } catch (err) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setCurrentUser(null);
          setError(err.message);
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Função para fazer login
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Salva o token no localStorage
      localStorage.setItem('token', token);
      
      // Configura o axios com o token
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      setError(null);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer registro
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer logout
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Limpa o erro
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated,
      loading,
      error,
      login,
      register,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};
