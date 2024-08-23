import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import PixSimulator from './components/PixSimulator';
import AuthComponent from './components/AuthComponent';
import Navbar from './components/NavBar';

const App: React.FC = () => {
  return (
    <Router basename="/woovi-leaky-bucket-challenge">
      <div>
        <Navbar />
        <AuthComponent>
          <Routes>
            <Route path="/login" element={<AuthForm />} />
            <Route path="/pix" element={<PixSimulator />} />
          </Routes>
        </AuthComponent>
      </div>
    </Router>
  );
};

export default App;
