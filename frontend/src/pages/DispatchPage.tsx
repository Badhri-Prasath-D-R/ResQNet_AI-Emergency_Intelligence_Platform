import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, Send, AlertTriangle, ShieldCheck, MapPin, Users, HeartPulse, Sparkles } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import { AIExplainabilityPanel } from '../components/tactical/AIExplainabilityPanel';
import { buildApiUrl } from '../config/api';

export const DispatchPage: React.FC = () => {
  const { 
    dispatchIncident, 
    setCurrentView, 
    setDispatchIncident, 
    resources, 
    token, 
    addAlert, 
    setIncidents, 
    setResources 
  } = useStore();

  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [responderName, setResponderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!dispatchIncident) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark p-6">
        <GlassCard className="p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Incident Selected</h2>
          <p className="text-sm text-gray-400 mb-6">Select an incident from the Command Center to begin dispatch procedures.</p>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold transition-all"
          >
            Go to Dashboard
          </button>
        </GlassCard>
      </div>
    );
  }

  // Find the selected resource to check availability limits
  const selectedResource = resources.find(r => r._id === selectedResourceId);
  const maxQty = selectedResource ? selectedResource.availability : 1;

  const handleBack = () => {
    setDispatchIncident(null);
    setCurrentView('dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId) {
      setErrorMsg('Please select a resource to allocate.');
      return;
    }
    if (!responderName.trim()) {
      setErrorMsg('Please input field responder team name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch(buildApiUrl('/api/dispatch'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          incident_id: dispatchIncident._id,
          resource_id: selectedResourceId,
          resource_type: selectedResource?.resource_type,
          quantity: quantity,
          responder_name: responderName,
          eta_minutes: 15.0
        })
      });

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.message || 'Dispatch failed');
      }

      addAlert(
        'Resource Dispatched',
        `Dispatched ${quantity}x ${selectedResource?.name} to incident: ${dispatchIncident.title}`,
        'info'
      );

      // Re-fetch updated lists
      const incRes = await fetch(buildApiUrl('/api/incidents'));
      const incJson = await incRes.json();
      if (incJson.success) setIncidents(incJson.data);

      const resRes = await fetch(buildApiUrl('/api/resources'));
      const resJsonList = await resRes.json();
      if (resJsonList.success) setResources(resJsonList.data);

      // Redirect back to dashboard on success
      handleBack();
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error occurred during dispatch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return 'bg-red-950 text-red-400 border-red-800';
      case 'high':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'medium':
        return 'bg-cyan-950 text-cyan-400 border-cyan-800';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-gray-150 p-6 flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-gray-850 rounded-lg text-gray-400 hover:text-white transition-colors border border-transparent hover:border-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              Tactical Dispatch Center
            </h1>
            <p className="text-xs text-gray-500 font-mono">EOC COMMAND & DECISION SUPPORT SYSTEM</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-cyan-950 bg-opacity-40 border border-cyan-850 px-3 py-1.5 rounded-lg text-cyan-400 text-xs font-semibold font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>SECURE COMMAND SESSION</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Incident Details & AI Explanation */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <GlassCard className="p-6 border border-gray-850">
            <div className="flex justify-between items-start mb-4">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${getUrgencyStyles(dispatchIncident.urgency)}`}>
                {dispatchIncident.urgency} Priority
              </span>
              <span className="text-[10px] text-gray-500 font-mono">ID: {dispatchIncident._id}</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">{dispatchIncident.title}</h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-6">{dispatchIncident.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-850 pt-5">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-900 rounded-lg text-cyan-400 border border-gray-800">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Coordinates</div>
                  <div className="text-xs font-mono font-medium text-white">
                    {dispatchIncident.location.coordinates[1].toFixed(5)}, {dispatchIncident.location.coordinates[0].toFixed(5)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-900 rounded-lg text-cyan-400 border border-gray-800">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Estimated Impact</div>
                  <div className="text-xs font-mono font-medium text-white">
                    {dispatchIncident.people_affected} People Affected
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-900 rounded-lg text-cyan-400 border border-gray-800">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Medical Severity</div>
                  <div className="text-xs font-mono font-medium text-white">
                    {dispatchIncident.medical_severity} / 10 rating
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* AI Explainability & Insights Panel */}
          <div className="flex-1 min-h-[300px]">
            <AIExplainabilityPanel incident={dispatchIncident} />
          </div>
        </div>

        {/* Right Hand: Interactive Dispatch Form */}
        <div className="lg:col-span-5">
          <GlassCard className="p-6 border border-cyan-950/60 sticky top-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Asset Dispatch Allocation</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Allocate operational personnel, vehicles, or emergency logistics to handle the event.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-400 text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Select Available Asset
                </label>
                <select
                  value={selectedResourceId}
                  onChange={(e) => {
                    setSelectedResourceId(e.target.value);
                    setQuantity(1);
                  }}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-semibold"
                >
                  <option value="">-- Choose asset from inventory --</option>
                  {resources
                    .filter((r) => r.availability > 0)
                    .map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name} ({r.resource_type.toUpperCase()} - {r.availability} left)
                      </option>
                    ))}
                </select>
              </div>

              {selectedResource && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Quantity (Max {maxQty})
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={maxQty}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Cost Estimate
                    </label>
                    <div className="w-full bg-gray-950 border border-gray-900 rounded-lg px-3 py-2 text-sm text-cyan-400 font-mono font-bold">
                      ${(quantity * (selectedResource?.cost_per_unit || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Responder Command / Team Call Sign
                </label>
                <input
                  type="text"
                  placeholder="e.g. Squad Delta-4, Fire-Rescue #12"
                  value={responderName}
                  onChange={(e) => setResponderName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-4 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 bg-gray-850 hover:bg-gray-800 text-gray-300 rounded-lg text-xs font-bold transition-all border border-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-cyan-950"
                >
                  {isSubmitting ? (
                    <span>Authorizing...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Confirm & Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};

export default DispatchPage;
