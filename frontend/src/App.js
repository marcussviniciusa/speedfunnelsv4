import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { AuthContext } from './context/AuthContext';
import { ThemeContext } from './context/ThemeContext';

// Layouts
import MainLayout from './components/layouts/MainLayout';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/ClientList';
import ClientDetails from './pages/ClientDetails';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import MetaAdsAnalytics from './pages/MetaAdsAnalytics';
import GoogleAnalytics from './pages/GoogleAnalytics';
import NotFound from './pages/NotFound';

// Componente de rota protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const { theme } = useContext(ThemeContext);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app-container">
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rotas protegidas dentro do layout principal */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<ClientList />} />
            <Route path="clients/:id" element={<ClientDetails />} />
            <Route path="meta-ads" element={<MetaAdsAnalytics />} />
            <Route path="google-analytics" element={<GoogleAnalytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Rota para página não encontrada */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </MuiThemeProvider>
  );
}

export default App;
