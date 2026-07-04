import React from 'react';
import type { Incident } from '../../store/useStore';
import GlassCard from '../common/GlassCard';
import { Brain, AlertCircle, TrendingUp, ShieldCheck, FileDown } from 'lucide-react';

interface AIExplainabilityPanelProps {
  incident: Incident | null;
}

export const AIExplainabilityPanel: React.FC<AIExplainabilityPanelProps> = ({ incident }) => {
  const downloadPDFReport = () => {
    if (!incident) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to download PDF reports");
      return;
    }

    const riskScore = (incident.medical_severity * 0.5) + (incident.vulnerability_score * 0.5);

    printWindow.document.write(`
      <html>
        <head>
          <title>ResQNet_Incident_Report_${incident._id}.pdf</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; line-height: 1.5; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0891b2; padding-bottom: 12px; margin-bottom: 24px; }
            .header h1 { margin: 0; color: #0891b2; font-size: 22px; font-weight: 800; text-transform: uppercase; }
            .header-meta { font-size: 11px; color: #64748b; font-family: monospace; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.05em; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
            .grid { display: grid; grid-cols: 2; gap: 16px; }
            .grid-2 { display: flex; gap: 20px; }
            .grid-2 > div { flex: 1; }
            .metric { font-size: 20px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 4px; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; font-family: monospace; text-transform: uppercase; border: 1px solid; }
            .badge-critical { background: #fee2e2; color: #991b1b; border-color: #f87171; }
            .badge-high { background: #fef3c7; color: #92400e; border-color: #fbbf24; }
            .badge-normal { background: #ecfdf5; color: #065f46; border-color: #34d399; }
            .footer { margin-top: 50px; border-t: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Emergency Incident Report</h1>
              <div class="header-meta">INCIDENT ID: ${incident._id}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; font-size: 12px; color: #0f172a;">RESQNET COMMAND CENTER</div>
              <div style="font-size: 10px; color: #64748b;">Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Incident Specifications</div>
            <div class="card">
              <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">${incident.title}</div>
              <div style="font-size: 12px; color: #475569; margin-bottom: 12px;">${incident.description}</div>
              <div class="grid-2">
                <div>
                  <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Incident Type</div>
                  <div style="font-size: 12px; font-weight: bold; text-transform: capitalize; color: #0891b2;">${incident.incident_type.replace('_', ' ')}</div>
                </div>
                <div>
                  <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Urgency Status</div>
                  <div class="badge ${incident.urgency.toLowerCase() === 'critical' ? 'badge-critical' : (incident.urgency.toLowerCase() === 'high' ? 'badge-high' : 'badge-normal')}">${incident.urgency}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">AI Diagnostics & Explainability</div>
            <div class="card">
              <div class="grid-2" style="margin-bottom: 16px;">
                <div>
                  <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Overall Risk Rating</div>
                  <div class="metric">${riskScore.toFixed(1)} / 10.0</div>
                </div>
                <div>
                  <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">AI Classification Confidence</div>
                  <div class="metric">${(incident.ai_confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">AI Rationale Explanation</div>
              <div style="font-size: 12px; color: #334155; background: #fff; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; line-height: 1.6;">
                ${incident.explanation || 'No reasoning details provided by the AI agent graph.'}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Operations & Logistics</div>
            <div class="card">
              <div style="margin-bottom: 12px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Public Safety Broadcast Message</div>
                <div style="font-size: 11px; font-family: monospace; color: #0369a1; background: #f0f9ff; padding: 8px; border-radius: 4px; margin-top: 4px;">
                  "${incident.broadcast_message || 'N/A'}"
                </div>
              </div>
              
              <div class="grid-2">
                <div>
                  <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">People Affected Count</div>
                  <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${incident.people_affected} individuals</div>
                </div>
                <div>
                  <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Geospatial Coordinates</div>
                  <div style="font-size: 12px; font-family: monospace; color: #0f172a; margin-top: 2px;">
                    ${incident.location?.coordinates ? `LAT: ${incident.location.coordinates[1].toFixed(5)}, LNG: ${incident.location.coordinates[0].toFixed(5)}` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            ResQNet AI Command Center &bull; Document Secure Audit Trail &bull; Page 1 of 1
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!incident) {
    return (
      <GlassCard className="p-6 h-full flex flex-col items-center justify-center text-center text-gray-500">
        <Brain className="w-12 h-12 text-gray-600 mb-3" />
        <h3 className="font-bold text-sm text-gray-400">AI Diagnostic Terminal</h3>
        <p className="text-xs max-w-xs mt-1 leading-relaxed">
          Select an incident from the operations feed to analyze real-time AI classification metrics and explainability parameters.
        </p>
      </GlassCard>
    );
  }

  // Calculate dynamic risk level based on severity
  const getRiskScore = () => {
    return (incident.medical_severity * 0.5) + (incident.vulnerability_score * 0.5);
  };

  const getAlternativeResources = (type: string) => {
    switch (type.toLowerCase()) {
      case 'flood':
        return ['Helicopter (1)', 'Food & Water Supplies (2)', 'Generators (1)'];
      case 'building_fire':
        return ['Ambulance (1)', 'Volunteer Team (1)'];
      case 'chemical_leak':
        return ['Ambulance (1)', 'Helicopter (1) for aerial tracking'];
      default:
        return ['Volunteer Team (2)', 'Water packs (10)'];
    }
  };

  const riskScore = getRiskScore();
  const confidencePercent = (incident.ai_confidence * 100).toFixed(0);

  return (
    <GlassCard className="p-5 h-full overflow-y-auto border border-cyan-900 border-opacity-30 flex flex-col space-y-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">AI Diagnostics</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={downloadPDFReport}
            className="p-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-850 hover:border-gray-800 text-gray-300 hover:text-white rounded flex items-center justify-center space-x-1 cursor-pointer transition-colors"
            title="Download PDF Incident Report"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">PDF</span>
          </button>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            Confidence: {confidencePercent}%
          </span>
        </div>
      </div>


      <div className="space-y-3">
        {/* Core Summary */}
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">AI Intake Summary</span>
          <p className="text-xs text-white leading-relaxed mt-0.5">{incident.ai_summary || incident.description}</p>
        </div>

        {/* Priority Gauge */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-gray-950 bg-opacity-40 border border-gray-900 rounded-lg">
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span>Risk Metric</span>
            </span>
            <div className="text-lg font-black text-white font-mono mt-1">
              {riskScore.toFixed(1)} <span className="text-xs text-gray-500">/ 10.0</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className={`h-1 rounded-full ${riskScore > 7 ? 'bg-red-500' : riskScore > 4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${riskScore * 10}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-gray-950 bg-opacity-40 border border-gray-900 rounded-lg">
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Status Severity</span>
            </span>
            <div className="text-lg font-black text-white font-mono mt-1">
              {incident.medical_severity} <span className="text-xs text-gray-500">/ 10.0</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className="h-1 rounded-full bg-emerald-500"
                style={{ width: `${incident.medical_severity * 10}%` }}
              />
            </div>
          </div>
        </div>

        {/* Explainability / Rationale */}
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Reasoning & Explanation</span>
          </span>
          <p className="text-xs text-gray-300 leading-relaxed mt-1 p-3 bg-gray-950 bg-opacity-30 border border-gray-900 rounded-lg font-medium">
            {incident.explanation || 'The model calculated urgency and recommendations based on coordinates proximity, density, and user-provided hazard details.'}
          </p>
        </div>

        {/* Broadcast Notification Text */}
        {incident.broadcast_message && (
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Public Safety Broadcast</span>
            <div className="mt-1 p-2.5 bg-cyan-950/20 border border-cyan-800/40 rounded text-[11px] text-cyan-200 select-all font-mono leading-normal">
              "{incident.broadcast_message}"
            </div>
          </div>
        )}

        {/* Alternative Recommendation & Potential Risks */}
        <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-1">
              Alternative Assets
            </span>
            <ul className="space-y-1 text-gray-300 font-mono">
              {getAlternativeResources(incident.incident_type).map((res, idx) => (
                <li key={idx} className="flex items-center space-x-1">
                  <span className="w-1 h-1 bg-cyan-400 rounded-full" />
                  <span>{res}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-1">
              Collateral Risks
            </span>
            <ul className="space-y-1 text-gray-400">
              <li className="flex items-center space-x-1 text-red-400/90 font-medium">
                <span className="w-1 h-1 bg-red-400 rounded-full" />
                <span>Secondary infrastructure blocks</span>
              </li>
              <li className="flex items-center space-x-1 text-gray-400">
                <span className="w-1 h-1 bg-gray-400 rounded-full" />
                <span>Resource exhaustion delay</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
export default AIExplainabilityPanel;
