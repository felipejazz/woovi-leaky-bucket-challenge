"use client";

import React, { useState } from 'react';
import { commitMutation } from 'react-relay';
import { RelayEnvironment } from '../RelayEnvironment';
import { LoginMutationResponse, RegisterMutationResponse } from '../interfaces/Responses';
import { mutationsLoginMutation, mutationsRegisterMutation } from '../relay/mutations';
import { useNavigate } from 'react-router-dom';
import { PayloadError } from 'relay-runtime';

const AuthForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuth = () => {
    let token = localStorage.getItem('authToken');
    if (token) {
      navigate('/pix');  
    }
    const mutation = isLogin ? mutationsLoginMutation : mutationsRegisterMutation;
    commitMutation(RelayEnvironment, {
      mutation,
      variables: { username, password },
      onCompleted: (response: {} | null, errors: readonly PayloadError[] | null | undefined) => {  
        if (isLogin && (response as LoginMutationResponse).login?.token) {
          const token = (response as LoginMutationResponse).login.token;
          localStorage.setItem('authToken', token);
          navigate('/login')
        } else if (isLogin && !((response as RegisterMutationResponse).register?.token)){
          alert('Login failed. You can register if you do not have an user.');
        }else if (!isLogin && (response as RegisterMutationResponse).register?.token) {
          alert('Registration successful! You can now log in.');
          setIsLogin(true);
        } else if (errors) {
          alert('Authentication failed. Please try again.');
        }
      },
      onError: (err) => {
        console.error(err);
        alert('Error: An issue occurred during authentication.');
      },
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{isLogin ? 'Login' : 'Register'}</h2>
      <div style={styles.form}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          style={styles.input}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={styles.input}
        />
        <button onClick={handleAuth} style={styles.button}>
          {isLogin ? 'Login' : 'Register'}
        </button>
        <button onClick={() => setIsLogin(!isLogin)} style={styles.switchButton}>
          {isLogin ? 'Switch to Register' : 'Switch to Login'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f4f4f4',
  },
  title: {
    marginBottom: '20px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    gap: '10px',
  },
  input: {
    padding: '10px',
    width: '250px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  switchButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default AuthForm;
