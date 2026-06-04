import React from 'react';
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
  // useNavigate is like a GPS — it lets us change the URL programmatically
  // Think of it like: calling navigate('/farmers') is like clicking a link
  const navigate = useNavigate();

  // useLocation reads the current URL
  // We use it to tell the Navbar which page is active
  const location = useLocation();

  // When someone clicks a zone on the map, go to /farmers?zone=2
  // The zone number is now stored IN THE URL, not in useState
  const goToZone = (zoneName) => {
    const zoneNumber = ZONE_NUMBER[zoneName] ?? null;
    if (zoneNumber !== null) {
      navigate(`/farmers?zone=${zoneNumber}`);
    } else {
      navigate('/farmers');
    }
  };

  // Work out which page is active from the URL
  // This tells the Navbar which button to highlight
  const getActivePage = () => {
    if (location.pathname === '/farmers') return 'FARMERS';
    if (location.pathname === '/alerts')  return 'ALERTS';
    if (location.pathname === '/predict') return 'PREDICT';
    return 'OVERVIEW';
  };

  // When navbar button is clicked, navigate to the right URL
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
      <Navbar page={getActivePage()} setPage={handleSetPage} onLogout={onLogout}/>

      {/* Routes is like a switchboard — it looks at the URL and renders the right page */}
      {/* Think of each Route as: "if the URL is X, show Y" */}
      <Routes>
        <Route path="/"        element={<OverviewPage onZoneClick={goToZone}/>}/>
        <Route path="/farmers" element={<FarmersPage/>}/>
        <Route path="/alerts"  element={<AlertsPage/>}/>
        <Route path="/predict" element={<PredictPage/>}/>
      </Routes>
    </div>
  );
}