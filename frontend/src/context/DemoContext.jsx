import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const DemoContext = createContext(null);

export const APT_STEPS = [
  {
    step: 1,
    title: "Initial Access",
    summary: "Suspicious authentication failure bursts from Tor exit IP (185.220.101.44) targeting Active Directory DC.",
    technique: "T1110 (Brute Force) & T1078 (Valid Accounts)",
    target: "CNI-DC-CORE-01"
  },
  {
    step: 2,
    title: "Lateral Movement",
    summary: "RDP session established from Domain Controller to Engineering Workstation 45 traversing Purdue boundary.",
    technique: "T1021 (Remote Services - RDP)",
    target: "CNI-ENG-WS-45"
  },
  {
    step: 3,
    title: "Privilege Escalation",
    summary: "Service account invokes PowerShell token stealing routine, obtaining NT AUTHORITY\\SYSTEM integrity.",
    technique: "T1068 (Exploitation for Privilege Escalation)",
    target: "CNI-ENG-WS-45"
  },
  {
    step: 4,
    title: "Data Exfiltration Attempt",
    summary: "Abnormal outbound TLS connection transferring 840 MB of SCADA Historian database to external VPS.",
    technique: "T1041 (Exfiltration Over C2 Channel)",
    target: "CNI-DATA-VAULT"
  },
  {
    step: 5,
    title: "AI Anomaly Detection",
    summary: "Isolation Forest ML engine evaluates 8 behavioral feature dimensions, identifying extreme outlier score (0.96).",
    technique: "Behavioral Heuristics & Tree Isolation Distance",
    target: "AI Detection Engine"
  },
  {
    step: 6,
    title: "Explainable AI (XAI) Justification",
    summary: "XAI module attributes primary outlier factors: High byte volume (+52%), Geo novelty (+24%), and Critical CNI asset (+14%).",
    technique: "Feature Contribution Decomposition",
    target: "XAI Explainer"
  },
  {
    step: 7,
    title: "Attack Campaign Correlation",
    summary: "System links isolated events into coordinated campaign 'SG-APT-001: Operation GridBreaker' with high risk score (94).",
    technique: "Multi-Stage Attack Graph Clustering",
    target: "Campaign Correlator"
  },
  {
    step: 8,
    title: "MITRE ATT&CK Mapping",
    summary: "Detections mapped to defensive tactics: Credential Access (T1110), Lateral Movement (T1021), Exfiltration (T1041).",
    technique: "MITRE Enterprise & ICS Framework",
    target: "MITRE Matrix"
  },
  {
    step: 9,
    title: "SOAR Automated Response Staging",
    summary: "SOAR engine stages Playbook PB-03: Quarantine CNI-DATA-VAULT, terminate socket, and draft CERT-In notification.",
    technique: "Automated Orchestration & Boundary Throttling",
    target: "SOAR Dispatcher"
  },
  {
    step: 10,
    title: "Analyst Approval & Containment",
    summary: "Security Administrator reviews pending high-impact action and approves simulated network boundary isolation.",
    technique: "Human-in-the-Loop Security Governance",
    target: "Analyst Workbench"
  },
  {
    step: 11,
    title: "Incident Tracking & Timeline",
    summary: "Incident INC-2026-0041 updated to 'Contained'. Complete audit trail preserved in tamper-evident ledger.",
    technique: "Incident Response Lifecycle",
    target: "Incident Manager"
  },
  {
    step: 12,
    title: "CERT-In Compliance Reporting",
    summary: "Automated generation of statutory cyber incident report under Section 70B of The IT Act (REF: CERT-IN-2026-CNI-0819).",
    technique: "National Regulatory Compliance",
    target: "Reporting Engine"
  }
];

export function DemoProvider({ children }) {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = ready, 1-12 = active/completed
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState('Presentation'); // 'Normal' (8s), 'Fast' (3s), 'Presentation' (5s)
  const [logs, setLogs] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const timerRef = useRef(null);

  const getStepInterval = () => {
    if (speed === 'Fast') return 2500;
    if (speed === 'Normal') return 8000;
    return 4500; // Presentation mode
  };

  const triggerDataRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const runStep = async (stepNum) => {
    try {
      const res = await api.runAptStep(stepNum, speed);
      setLogs(prev => [
        {
          id: Date.now(),
          step: stepNum,
          name: res.name,
          desc: res.description,
          action: res.action_taken,
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
      triggerDataRefresh();
    } catch (err) {
      console.error('Error running APT step:', err);
    }
  };

  useEffect(() => {
    if (isPlaying && !isPaused) {
      if (currentStep < 12) {
        timerRef.current = setTimeout(() => {
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          runStep(nextStep);
          if (nextStep === 12) {
            setIsPlaying(false);
          }
        }, getStepInterval());
      } else {
        setIsPlaying(false);
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, isPaused, currentStep, speed]);

  const startAptSimulation = () => {
    if (currentStep >= 12) {
      setCurrentStep(0);
      setLogs([]);
    }
    setIsPlaying(true);
    setIsPaused(false);
    if (currentStep === 0) {
      setCurrentStep(1);
      runStep(1);
    }
  };

  const pauseAptSimulation = () => {
    setIsPaused(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const resumeAptSimulation = () => {
    setIsPaused(false);
    setIsPlaying(true);
  };

  const resetAptSimulation = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStep(0);
    setLogs([]);
    try {
      await api.resetDemoData();
      triggerDataRefresh();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const stepForward = () => {
    if (currentStep < 12) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      runStep(nextStep);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoModalOpen,
        setIsDemoModalOpen,
        currentStep,
        isPlaying,
        isPaused,
        speed,
        setSpeed,
        logs,
        startAptSimulation,
        pauseAptSimulation,
        resumeAptSimulation,
        resetAptSimulation,
        stepForward,
        refreshKey,
        triggerDataRefresh
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
