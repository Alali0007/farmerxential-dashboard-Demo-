import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainApp from './pages/MainApp';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  // BrowserRouter is like installing the routing system in the whole building
  // Everything inside it can now use URLs and navigation
  return (
    <BrowserRouter>
      {loggedIn
        ? <MainApp onLogout={() => setLoggedIn(false)} />
        : <LoginPage onLogin={() => setLoggedIn(true)} />
      }
    </BrowserRouter>
  );
}