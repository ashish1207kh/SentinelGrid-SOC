import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoProvider } from './context/DemoContext';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import DemoModal from './components/DemoModal';

// Pages
import LoginPage from './pages/LoginPage';
import OverviewDashboard from './pages/OverviewDashboard';
import SecurityAlerts from './pages/SecurityAlerts';
import AITDetection from './pages/AITDetection';
import AttackCampaigns from './pages/AttackCampaigns';
import MitreAttack from './pages/MitreAttack';
import SecurityLogs from './pages/SecurityLogs';
import AssetInventory from './pages/AssetInventory';
import SoarAutomation from './pages/SoarAutomation';
import IncidentManagement from './pages/IncidentManagement';
import CertInReporting from './pages/CertInReporting';
import AuditLogs from './pages/AuditLogs';
import SettingsPage from './pages/SettingsPage';

function MainApp() {
  const { isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState('Overview Dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'Overview Dashboard':
        return <OverviewDashboard setActivePage={setActivePage} />;
      case 'Security Alerts':
        return <SecurityAlerts setActivePage={setActivePage} />;
      case 'AI Threat Detection':
        return <AITDetection setActivePage={setActivePage} />;
      case 'Attack Campaigns':
        return <AttackCampaigns setActivePage={setActivePage} />;
      case 'MITRE ATT&CK':
        return <MitreAttack setActivePage={setActivePage} />;
      case 'Security Logs':
        return <SecurityLogs />;
      case 'Asset & Device Inventory':
        return <AssetInventory />;
      case 'SOAR Automation':
        return <SoarAutomation />;
      case 'Incident Management':
        return <IncidentManagement setActivePage={setActivePage} />;
      case 'CERT-In Reporting':
        return <CertInReporting />;
      case 'Audit Logs':
        return <AuditLogs />;
      case 'Settings':
        return <SettingsPage />;
      default:
        return <OverviewDashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080B12] text-slate-100 flex flex-col font-sans">
      <TopNav activePage={activePage} setActivePage={setActivePage} />

      <div className="flex flex-1">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      {/* Global Interactive Demo Mode Simulation Modal */}
      <DemoModal setActivePage={setActivePage} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DemoProvider>
        <MainApp />
      </DemoProvider>
    </AuthProvider>
  );
}
