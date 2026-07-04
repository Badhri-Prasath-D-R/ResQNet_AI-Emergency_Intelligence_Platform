import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Incident } from '../../store/useStore';
import { X, Send, AlertTriangle } from 'lucide-react';
import GlassCard from '../common/GlassCard';

interface DispatchModalProps {
  incident: Incident;
  onClose: () => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({ incident, onClose }) => {
  const { resources, token, addAlert, setIncidents, setResources } = useStore();
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [responderName, setResponderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Find the selected resource to check availability limits
  const selectedResource = resources.find(r => r._id === selectedResourceId);
  const maxQty = selectedResource ? selectedResource.availability : 1;

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
      const response = await fetch('http://localhost:8000/api/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          incident_id: incident._id,
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
        `Dispatched ${quantity}x ${selectedResource?.name} to incident: ${incident.title}`,
        'info'
      );

      // Re-fetch updated lists
      const incRes = await fetch('http://localhost:8000/api/incidents');
      const incJson = await incRes.json();
      if (incJson.success) setIncidents(incJson.data);

      const resRes = await fetch('http://localhost:8000/api/resources');
      const resJsonList = await resRes.json();
      if (resJsonList.success) setResources(resJsonList.data);

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error occurred during dispatch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg">
        <GlassCard className="p-6 relative border border-cyan-800 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-bold text-white mb-2 flex items-center space-x-2">
            <span>Tactical Resource Dispatch</span>
          </h2>
          <p className="text-xs text-gray-400 mb-4 truncate font-mono">
            Incident target: {incident.title}
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-400 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Select Available Asset
              </label>
              <select
                value={selectedResourceId}
                onChange={(e) => {
                  setSelectedResourceId(e.target.value);
                  setQuantity(1);
                }}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Cost Estimate
                  </label>
                  <div className="w-full bg-gray-950 border border-gray-900 rounded-lg px-3 py-2 text-sm text-cyan-400 font-mono font-bold">
                    ${(quantity * (selectedResource?.cost_per_unit || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Responder/Command Team
              </label>
              <input
                type="text"
                placeholder="e.g. Squad Delta-4, Fire-Rescue #12"
                value={responderName}
                onChange={(e) => setResponderName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-950"
              >
                {isSubmitting ? (
                  <span>Dispatching...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Authorize Dispatch</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};
export default DispatchModal;
