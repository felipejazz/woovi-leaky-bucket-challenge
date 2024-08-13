"use client";

import React, { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthComponentProps {
  children: ReactNode;
}

const AuthComponent: React.FC<AuthComponentProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Estado para indicar que estamos verificando a autenticação

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    } else {
      if (location.pathname === '/login') {
        navigate('/pix', { replace: true });
      }
    }

    setIsCheckingAuth(false); // Concluímos a verificação de autenticação
  }, [navigate, location]);

  if (isCheckingAuth) {
    <p>
        Redirecionando...
    </p>
    return null; 
  }

  return <>{children}</>;
};

export default AuthComponent;
