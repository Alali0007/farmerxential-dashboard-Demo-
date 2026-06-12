import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainApp from './pages/MainApp';
import FieldAgentPage from './pages/FieldAgentPage';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <Routes>

        {/* ── Field Agent Portal — standalone, no auth needed ── */}
        {/* Jim goes to /field on his phone — completely separate from dashboard */}
        <Route path="/field/*" element={<FieldAgentPage />} />

        {/* ── Main Dashboard — requires login ── */}
        <Route
          path="/*"
          element={
            loggedIn
              ? <MainApp onLogout={() => setLoggedIn(false)} />
              : <LoginPage onLogin={() => setLoggedIn(true)} />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}