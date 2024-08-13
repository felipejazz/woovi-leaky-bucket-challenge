"use client";

import React, { useState } from 'react';
import { commitMutation } from 'react-relay';
import { RelayEnvironment } from '../RelayEnvironment';
import { mutationsPixSimulatorMutation } from '../relay/mutations';
import { mutationsPixSimulatorMutation$data } from '../relay/__generated__/mutationsPixSimulatorMutation.graphql';

const PixSimulator: React.FC = () => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState(0);

  const handleSimulate = () => {
    commitMutation(RelayEnvironment, {
      mutation: mutationsPixSimulatorMutation,
      variables: { key, value },
      onCompleted: (response: mutationsPixSimulatorMutation$data | null) => {
        if (response?.simulatePixQuery) {
          const { successMessage, errorMessage, tokensLeft } = response.simulatePixQuery;

          if (successMessage) {
            alert(`Success! ${successMessage}\nRemaining Tokens: ${tokensLeft}`);
          } else if (errorMessage) {
            if (errorMessage === "Invalid PIX FORMAT. only positives values are allowed.") {
              alert(`ERROR: Invalid PIX key format. Accepted formats:\n- Email: example@mail.com\n- Phone: +5511999999999`);
            } else {
              alert(`ERROR: Invalid PIX value. It must be a positive non-zero amount.\nRemaining Tokens: ${tokensLeft}`);
            }
          }
        }
      },
      onError: (err: any) => {
        console.error(err);
        alert('Error: An unexpected error occurred. Please try again later.');
      },
    } as any);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Simulate Pix</h2>
      <div style={styles.form}>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Pix Key"
          style={styles.input}
        />
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value))}
          placeholder="Value"
          style={styles.input}
        />
        <button onClick={handleSimulate} style={styles.button}>Simulate</button>
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
};

export default PixSimulator;
