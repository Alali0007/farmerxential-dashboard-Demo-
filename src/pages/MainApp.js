import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import OverviewPage from './OverviewPage';
import FarmersPage from './FarmersPage';
import AlertsPage from './AlertsPage';
import PredictPage from './PredictPage';

const C = { bg: '#060D0A', green: '#1B4332' };

const ZONE_NUMBER = {
  'North West': 2, 'North East': 1, 'North Central': 0,
  'South West': 5, 'South East': 3, 'South South': 4
};

export default function MainApp({ onLogout }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── Slow loading detection ──
  // If any page takes more than 3 seconds to load, show the warning banner
  // Think of it like a timer — if the postman hasn't arrived in 3 seconds,
  // slide a note under the door saying "he's on the way"
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const slowTimerRef                      = useRef(null);

  // When loading starts, start a 3 second timer
  // If loading finishes before 3 seconds, cancel the timer — no banner shown
  // If loading takes longer, show the banner
  useEffect(() => {
    if (isLoading) {
      slowTimerRef.current = setTimeout(() => {
        setIsSlowLoading(true);
      }, 3000);
    } else {
      // Loading finished — hide banner and cancel timer
      clearTimeout(slowTimerRef.current);
      setIsSlowLoading(false);
    }
    return () => clearTimeout(slowTimerRef.current);
  }, [isLoading]);

  const goToZone = (zoneName) => {
    const zoneNumber = ZONE_NUMBER[zoneName] ?? null;
    if (zoneNumber !== null) {
      navigate(`/farmers?zone=${zoneNumber}`);
    } else {
      navigate('/farmers');
    }
  };

  const getActivePage = () => {
    if (location.pathname === '/farmers') return 'FARMERS';
    if (location.pathname === '/alerts')  return 'ALERTS';
    if (location.pathname === '/predict') return 'PREDICT';
    return 'OVERVIEW';
  };

  const handleSetPage = (newPage) => {
    if (newPage === 'OVERVIEW') navigate('/');
    if (newPage === 'FARMERS')  navigate('/farmers');
    if (newPage === 'ALERTS')   navigate('/alerts');
    if (newPage === 'PREDICT')  navigate('/predict');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      backgroundImage: `
        linear-gradient(${C.green}10 1px, transparent 1px),
        linear-gradient(90deg, ${C.green}10 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px'
    }}>
      <Navbar
        page={getActivePage()}
        setPage={handleSetPage}
        onLogout={onLogout}
        isSlowLoading={isSlowLoading}
      />

      <Routes>
        <Route path="/"        element={<OverviewPage onZoneClick={goToZone} onLoadingChange={setIsLoading}/>}/>
        <Route path="/farmers" element={<FarmersPage onLoadingChange={setIsLoading}/>}/>
        <Route path="/alerts"  element={<AlertsPage onLoadingChange={setIsLoading}/>}/>
        <Route path="/predict" element={<PredictPage/>}/>
      </Routes>
    </div>
  );
}