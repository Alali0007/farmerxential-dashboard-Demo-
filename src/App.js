import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import MainApp from './pages/MainApp';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn
    ? <MainApp onLogout={() => setLoggedIn(false)} />
    : <LoginPage onLogin={() => setLoggedIn(true)} />;
}