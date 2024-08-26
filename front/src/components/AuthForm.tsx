"use client";

import React, { useState, FormEvent } from 'react';
import { commitMutation } from 'react-relay';
import { RelayEnvironment } from '../RelayEnvironment';
import { LoginMutationResponse, RegisterMutationResponse } from '../interfaces/Responses';
import { mutationsLoginMutation, mutationsRegisterMutation } from '../relay/mutations';
import { useNavigate } from 'react-router-dom';

const AuthForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuth = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
  
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/pix');
      return;
    }
  
    const mutation = isLogin ? mutationsLoginMutation : mutationsRegisterMutation;
    commitMutation(RelayEnvironment, {
      mutation,
      variables: { userName: username, password }, 
      onCompleted: (response: {} | null) => {
        switch (true) {
          case isLogin: {
            const loginResponse = response as LoginMutationResponse;
            const token = loginResponse?.login?.token;
  
            if (!token) {
              alert('Login failed. You can register if you do not have a user or check your password.');
              break;
            }
            localStorage.setItem('authToken', token);
            navigate('/pix');
            break;
          }
          case !isLogin: {
            const registerResponse = response as RegisterMutationResponse;
            const errorMessage = registerResponse?.register?.errorMessage;
            const successMessage = registerResponse?.register?.successMessage;
  
            if (successMessage) {
              alert('Registration successful. You can now log in.');
              setIsLogin(true);
              break;
            }
  
            if (errorMessage) {
              if (errorMessage === 'Username already exists') {
                alert('User already exists in our database.');
              } else {
                alert('Registration failed due to unknown causes.');
              }
              setIsLogin(true);
            }
            break;
          }
          default:
            alert('Unexpected response format.');
            break;
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
      <form onSubmit={handleAuth} style={styles.form}>
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
        <button type="submit" style={styles.button}>
          {isLogin ? 'Login' : 'Register'}
        </button>
        <button type="button" onClick={() => setIsLogin(!isLogin)} style={styles.switchButton}>
          {isLogin ? 'Switch to Register' : 'Switch to Login'}
        </button>
      </form>
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
