"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <nav style={styles.navbar}>
      <button onClick={handleLogout} style={styles.button}>
        Logout
      </button>
    </nav>
  );
};

const styles = {
  navbar: {
    padding: '10px',
    backgroundColor: '#333',
    color: '#fff',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    backgroundColor: '#f00',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    cursor: 'pointer',
    borderRadius: '5px',
  },
};

export default Navbar;
