"use client";

import React, { useState } from 'react';
import { commitMutation } from 'react-relay';
import { RelayEnvironment } from '../RelayEnvironment';
import { mutationsPixSimulatorMutation } from '../relay/mutations';
import { mutationsPixSimulatorMutation$data } from '../relay/__generated__/mutationsPixSimulatorMutation.graphql';

interface PixRequest {
  id: number;
  key: string;
  value: number;
  status: 'pending' | 'success' | 'error';
  message?: string;
  tokensLeft?: number;
}

const PixSimulator: React.FC = () => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState(0);
  const [pixRequests, setPixRequests] = useState<PixRequest[]>([]);

  const handleSimulate = () => {
    const requestId = pixRequests.length + 1;

    setPixRequests([
      ...pixRequests,
      { id: requestId, key, value, status: 'pending' },
    ]);

    commitMutation(RelayEnvironment, {
      mutation: mutationsPixSimulatorMutation,
      variables: { key, value },
      onCompleted: (response: mutationsPixSimulatorMutation$data | null) => {
        let status: PixRequest['status'] = 'error';
        let message = 'Unknown error';
        let tokensLeft: number | undefined;

        if (response?.simulatePixQuery) {
          const { successMessage, errorMessage, tokensLeft: remainingTokens, newUserToken } = response.simulatePixQuery;
          tokensLeft = remainingTokens ?? undefined;
          if (newUserToken) {
            localStorage.setItem('authToken', newUserToken);
          }

          if (successMessage) {
            status = 'success';
            message = successMessage;
          } else if (errorMessage) {
            if (errorMessage === "Token Revoked") {
              message = "Token has been revoked.";
            } else {
              message = errorMessage;
            }
          }
        }

        setPixRequests(prevRequests =>
          prevRequests.map(request =>
            request.id === requestId
              ? { ...request, status, message, tokensLeft }
              : request
          )
        );
      },
      onError: (err: any) => {
        let message = 'Mutation error';
        let status: PixRequest['status'] = 'error';
        let tokensLeft: number | undefined;

        try {
          const errorJson = err?.source?.errors?.[0]?.extensions || err?.response?.json();
          if (errorJson?.errorMessage === 'Token Revoked') {
            message = 'Token has been revoked.';
          } else if (errorJson?.errorMessage) {
            message = errorJson.errorMessage;
          } else {
            message = 'An unexpected error occurred. Please try again later.';
          }

          tokensLeft = errorJson?.tokensLeft;
        } catch (jsonError) {
          console.error('Failed to parse error:', jsonError);
          message = 'An unexpected error occurred. Please try again later.';
        }

        setPixRequests(prevRequests =>
          prevRequests.map(request =>
            request.id === requestId
              ? { ...request, status, message, tokensLeft }
              : request
          )
        );
      },
    } as any);
  };

  return (
    <div style={styles.container}>
      <div style={styles.column}>
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

      <div style={styles.column}>
        <h2 style={styles.title}>Pix Requests</h2>
        <div style={styles.requestList}>
          {pixRequests.map((request) => (
            <div
              key={request.id}
              style={{
                ...styles.requestItem,
                backgroundColor:
                  request.status === 'pending'
                    ? '#ffeb3b' 
                    : request.status === 'success'
                    ? '#4caf50' 
                    : '#f44336',
              }}
            >
              <p>Pix: {request.key} - {request.value}</p>
              {request.message && <p>{request.message}</p>}
              {request.tokensLeft !== undefined && <p>Tokens left: {request.tokensLeft}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between',
    height: '100vh',
    padding: '20px',
    backgroundColor: '#f4f4f4',
  },
  column: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
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
  requestList: {
    width: '100%',
    maxHeight: '70vh',
    overflowY: 'auto' as 'auto',
  },
  requestItem: {
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '10px',
    color: '#fff',
  },
};

export default PixSimulator;
