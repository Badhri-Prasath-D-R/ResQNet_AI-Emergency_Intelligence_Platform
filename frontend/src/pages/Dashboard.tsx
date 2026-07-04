import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { MetricCard } from '../components/common/MetricCard';
import { IncidentCard } from '../components/common/IncidentCard';
import { AIExplainabilityPanel } from '../components/tactical/AIExplainabilityPanel';
import {
  AlertTriangle,
  Activity,
  Users,
  ShieldCheck,
  Zap,
  Plus,
  Keyboard,
  ShieldAlert
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import { buildApiUrl, buildWsUrl } from '../config/api';

export const Dashboard: React.FC = () => {
  const store = useStore();
  const [showReportForm, setShowReportForm] = useState(false);
  
  // Incident Report states
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const incRes = await fetch(buildApiUrl('/api/incidents'));
      const incJson = await incRes.json();
      if (incJson.success) store.setIncidents(incJson.data);

      const resRes = await fetch(buildApiUrl('/api/resources'));
      const resJson = await resRes.json();
      if (resJson.success) store.setResources(resJson.data);

      const shRes = await fetch(buildApiUrl('/api/shelters'));
      const shJson = await shRes.json();
      if (shJson.success) store.setShelters(shJson.data);

      const stRes = await fetch(buildApiUrl('/api/stations'));
      const stJson = await stRes.json();
      if (stJson.success) store.setStations(stJson.data);

      const kpiRes = await fetch(buildApiUrl('/api/dashboard'));
      const kpiJson = await kpiRes.json();
      if (kpiJson.success) store.setKPIs(kpiJson.data);

      const dRes = await fetch(buildApiUrl('/api/dispatch/history'));
      const dJson = await dRes.json();
      if (dJson.success) store.setDispatchHistory(dJson.data);

    } catch (err) {
      console.error("Error loading EOC operational data:", err);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup WebSockets
    const ws = new WebSocket(buildWsUrl('/ws'));
    
    ws.onopen = () => {
      console.log('WebSocket channel established.');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("WebSocket frame received:", payload);
        
        switch (payload.type) {
          case 'INCIDENT_UPDATE':
            fetchData();
            break;
          case 'RESOURCE_UPDATE':
            fetchData();
            break;
          case 'ALERT':
            store.addAlert(payload.title, payload.message, payload.type || 'info');
            fetchData();
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("Error parsing socket frame:", err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket channel closed.');
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) {
      setReportError("Fill in title and description.");
      return;
    }
    setReportLoading(true);
    setReportError('');

    try {
      const response = await fetch(buildApiUrl('/api/report'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.token}`
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          incident_type: 'unknown',
          location: {
            type: 'Point',
            coordinates: [80.2707, 13.0827]
          }
        })
      });
      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.message);
      }
      setNewTitle('');
      setNewDescription('');
      setShowReportForm(false);
      store.addAlert('New Incident Intake', 'Incident reported and processed by AI graph agents.', 'critical');
      fetchData();
    } catch (err: any) {
      setReportError(err.message || 'Report intake failed.');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider flex items-center">
            <ShieldAlert className="w-5 h-5 text-cyan-400 mr-2" />
            Operations Overview
          </h1>
          <p className="text-xs text-gray-400">
            AI-Augmented Emergency Management & Response System.
          </p>
        </div>

        <div className="hidden md:flex items-center space-x-1 border border-gray-800 bg-gray-950 px-2.5 py-1 rounded text-[10px] text-gray-400 font-mono">
          <Keyboard className="w-3.5 h-3.5 mr-1" />
          <span>Search Command:</span>
          <kbd className="bg-gray-900 border border-gray-750 px-1 rounded text-cyan-400 ml-1 font-sans">Ctrl + K</kbd>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 flex-shrink-0">
        <MetricCard title="Total Incidents" value={store.kpis.total_incidents} icon={<Activity className="w-5 h-5" />} />
        <MetricCard title="Critical Crises" value={store.kpis.critical_incidents} icon={<AlertTriangle className="w-5 h-5" />} glow={store.kpis.critical_incidents > 0} />
        <MetricCard title="Active Responders" value={store.kpis.active_responders} icon={<Users className="w-5 h-5" />} />
        <MetricCard title="Assets Stocked" value={store.kpis.resources_available} icon={<Zap className="w-5 h-5" />} />
        <MetricCard title="Avg ETA Mins" value={store.kpis.avg_response_time_min} icon={<Activity className="w-5 h-5" />} decimals={1} />
        <MetricCard title="Success Rate" value={store.kpis.dispatch_success_rate} icon={<ShieldCheck className="w-5 h-5" />} suffix="%" decimals={1} />
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        
        {/* Left Column: Operations Feed (Col Span 4) */}
        <div className="lg:col-span-4 flex flex-col space-y-3 min-h-0 h-full">
          <div className="flex items-center justify-between flex-shrink-0">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-white">Incident Operations Feed</h2>
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded text-white flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showReportForm && (
            <GlassCard className="p-4 border border-cyan-800 flex-shrink-0">
              <h4 className="text-xs font-bold text-white mb-3">Report Crisis Incident</h4>
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Crisis Title (e.g. Substation fire)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-xs text-white placeholder-gray-500"
                />
                <textarea
                  placeholder="Provide brief details on coordinates, hazards..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-xs text-white placeholder-gray-500 h-16 resize-none"
                />
                {reportError && <div className="text-[10px] text-red-400 font-bold">{reportError}</div>}
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="px-2.5 py-1 bg-gray-800 text-gray-400 rounded text-[10px] font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportLoading}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold"
                  >
                    {reportLoading ? 'Processing...' : 'Submit'}
                  </button>
                </div>
              </form>
            </GlassCard>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {store.incidents.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-500">No active incidents found.</div>
            ) : (
              store.incidents.map((inc) => (
                <IncidentCard
                  key={inc._id}
                  incident={inc}
                  onDispatch={(incident) => {
                    store.setDispatchIncident(incident);
                    store.setCurrentView('dispatch');
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Center Column: AI Explainability Panel (Col Span 5) */}
        <div className="lg:col-span-5 flex flex-col space-y-3 min-h-0 h-full">
          <h2 className="text-xs uppercase font-extrabold tracking-wider text-white flex-shrink-0">AI Explainability & Analysis</h2>
          <div className="flex-1 min-h-0">
            <AIExplainabilityPanel incident={store.activeIncident} />
          </div>
        </div>

        {/* Right Column: EOC Dispatch & Response Log summary (Col Span 3) */}
        <div className="lg:col-span-3 flex flex-col space-y-3 min-h-0 h-full">
          <h2 className="text-xs uppercase font-extrabold tracking-wider text-white flex-shrink-0">
            EOC Dispatch & Response Log
          </h2>
          <GlassCard className="p-4 flex-1 overflow-hidden flex flex-col border border-gray-850">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[10px]">
              {store.dispatchHistory.length === 0 ? (
                <div className="text-gray-500 text-center py-6">No dispatch reports generated.</div>
              ) : (
                store.dispatchHistory.map((log) => (
                  <div key={log._id} className="p-2 bg-gray-950 bg-opacity-40 border border-gray-900 rounded flex flex-col space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-cyan-400 font-bold">[{log.status.toUpperCase()}]</span>
                      <span className="text-gray-500">{new Date(log.dispatched_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-white">
                      {log.quantity}x {log.resource_type.toUpperCase()} dispatched
                    </div>
                    <div className="text-gray-500 text-[9px]">
                      Team: {log.responder_name}
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
