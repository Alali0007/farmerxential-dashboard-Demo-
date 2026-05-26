import React, { useState } from 'react';
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
  const [page, setPage]             = useState('OVERVIEW');
  const [zoneFilter, setZoneFilter] = useState(null);

  const goToZone = (zoneName) => {
    setZoneFilter(ZONE_NUMBER[zoneName] ?? null);
    setPage('FARMERS');
  };

  const handleSetPage = (newPage) => {
    if (newPage !== 'FARMERS') setZoneFilter(null);
    setPage(newPage);
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
      <Navbar page={page} setPage={handleSetPage} onLogout={onLogout}/>
      {page === 'OVERVIEW' && <OverviewPage onZoneClick={goToZone}/>}
      {page === 'FARMERS'  && <FarmersPage key={zoneFilter} initialZone={zoneFilter}/>}
      {page === 'ALERTS'   && <AlertsPage/>}
      {page === 'PREDICT'  && <PredictPage/>}
    </div>
  );
}