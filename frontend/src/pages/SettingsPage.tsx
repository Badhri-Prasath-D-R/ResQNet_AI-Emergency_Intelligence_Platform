import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import GlassCard from '../components/common/GlassCard';
import { Play, Pause, Square, Sun, Moon, Server, User, Cpu, ShieldCheck } from 'lucide-react';
import { buildApiUrl } from '../config/api';

export const SettingsPage: React.FC = () => {
  const store = useStore();

  // AI Configuration States
  const [useCloudAi, setUseCloudAi] = useState(false);
  const [cloudAiBaseUrl, setCloudAiBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [cloudAiApiKey, setCloudAiApiKey] = useState('');
  const [cloudAiModelName, setCloudAiModelName] = useState('google/gemini-2.5-flash');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchAIConfig = async () => {
    setFetchLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/settings/ai'), {
        headers: {
          'Authorization': `Bearer ${store.token}`,
        },
      });
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.success && resJson.data) {
          setUseCloudAi(resJson.data.use_cloud_ai);
          setCloudAiBaseUrl(resJson.data.cloud_ai_base_url);
          setCloudAiApiKey(resJson.data.cloud_ai_api_key);
          setCloudAiModelName(resJson.data.cloud_ai_model_name);
        }
      }
    } catch (err) {
      console.error('Error fetching AI settings:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchAIConfig();
  }, []);

  const handleSaveAIConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/settings/ai'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.token}`,
        },
        body: JSON.stringify({
          use_cloud_ai: useCloudAi,
          cloud_ai_base_url: cloudAiBaseUrl,
          cloud_ai_api_key: cloudAiApiKey,
          cloud_ai_model_name: cloudAiModelName,
        }),
      });
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.success) {
          store.addAlert('AI Settings Saved', 'External API credentials successfully registered.', 'info');
          fetchAIConfig();
        }
      }
    } catch (err) {
      console.error(err);
      store.addAlert('Error Saving Settings', 'Could not establish connection to settings database.', 'critical');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSimAction = async (action: 'start' | 'pause' | 'stop' | 'resume') => {
    try {
      const response = await fetch(buildApiUrl(`/api/simulate/${action}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${store.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          store.setSimulationStatus(data.data.status);
          store.addAlert(
            'Simulation Updated',
            `Simulation status is now ${data.data.status}.`,
            'info'
          );
        } else {
          store.addAlert('Simulation Update Failed', data.message, 'warning');
        }
      }
    } catch (err) {
      console.error(err);
      store.addAlert('Simulation Error', 'Failed to communicate with simulation engine API.', 'critical');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white uppercase tracking-wider">
          System Settings & Simulation Engine
        </h1>
        <p className="text-xs text-gray-400">
          Control active simulation streams, configure AI models, and view system endpoints.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dynamic LLM Provider configuration */}
        <GlassCard className="p-5 border border-cyan-800/40 md:col-span-2">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2 flex items-center">
            <Cpu className="w-4 h-4 text-cyan-400 mr-2" />
            AI Model Provider Credentials
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Toggle between the default local LM Studio configuration and an external cloud LLM provider (OpenAI, OpenRouter, etc.).
          </p>

          {fetchLoading ? (
            <div className="text-xs text-gray-500 py-4">Fetching current EOC configurations...</div>
          ) : (
            <form onSubmit={handleSaveAIConfig} className="space-y-4">
              <div className="flex items-center space-x-3 bg-gray-950 bg-opacity-40 p-3 rounded-lg border border-gray-900">
                <input
                  type="checkbox"
                  id="toggle-cloud-ai"
                  checked={useCloudAi}
                  onChange={(e) => setUseCloudAi(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
                <label htmlFor="toggle-cloud-ai" className="text-xs font-semibold text-gray-200 cursor-pointer">
                  Use External Cloud LLM Model instead of Local LM Studio
                </label>
              </div>

              {useCloudAi && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      Provider Base URL
                    </label>
                    <input
                      type="text"
                      value={cloudAiBaseUrl}
                      onChange={(e) => setCloudAiBaseUrl(e.target.value)}
                      className="bg-gray-950 border border-gray-800 text-xs text-gray-300 rounded p-2 focus:outline-none focus:border-cyan-600 font-semibold"
                      placeholder="https://openrouter.ai/api/v1"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      API Model Name
                    </label>
                    <input
                      type="text"
                      value={cloudAiModelName}
                      onChange={(e) => setCloudAiModelName(e.target.value)}
                      className="bg-gray-950 border border-gray-800 text-xs text-gray-300 rounded p-2 focus:outline-none focus:border-cyan-600 font-semibold"
                      placeholder="google/gemini-2.5-flash"
                    />
                  </div>

                  <div className="flex flex-col space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                      API Bearer Key
                    </label>
                    <input
                      type="password"
                      value={cloudAiApiKey}
                      onChange={(e) => setCloudAiApiKey(e.target.value)}
                      className="bg-gray-950 border border-gray-800 text-xs text-gray-300 rounded p-2 focus:outline-none focus:border-cyan-600 font-mono"
                      placeholder="sk-or-v1-..."
                    />
                    <span className="text-[9px] text-gray-500">
                      Keys are masked. Enter a new key to overwrite the saved value, or leave unchanged.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 rounded text-white font-bold text-xs cursor-pointer flex items-center space-x-1.5 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{saveLoading ? 'Saving...' : 'Apply API Credentials'}</span>
                </button>
              </div>
            </form>
          )}
        </GlassCard>

        {/* Simulation stream manager */}
        <GlassCard className="p-5 border border-gray-850 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2">
              Simulation Stream Manager
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Simulate live regional disaster intake & responder arrival ticks. The engine feeds mock data to test geospatial and AI models.
            </p>

            <div className="flex items-center space-x-2 mb-4">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Engine Status:</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded font-extrabold uppercase tracking-wider border ${
                store.simulationStatus === 'running' 
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                  : (store.simulationStatus === 'paused' ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-gray-850 text-gray-500 border-gray-800')
              }`}>
                {store.simulationStatus}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            {store.simulationStatus !== 'running' ? (
              <button
                onClick={() => handleSimAction(store.simulationStatus === 'paused' ? 'resume' : 'start')}
                className="flex-1 py-2 bg-emerald-650 hover:bg-emerald-550 rounded text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{store.simulationStatus === 'paused' ? 'Resume Stream' : 'Start Stream'}</span>
              </button>
            ) : (
              <button
                onClick={() => handleSimAction('pause')}
                className="flex-1 py-2 bg-amber-650 hover:bg-amber-550 rounded text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Stream</span>
              </button>
            )}

            <button
              onClick={() => handleSimAction('stop')}
              disabled={store.simulationStatus === 'stopped'}
              className="flex-1 py-2 bg-rose-650 hover:bg-rose-550 disabled:opacity-40 rounded text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Stream</span>
            </button>
          </div>
        </GlassCard>

        {/* Display Preference */}
        <GlassCard className="p-5 border border-gray-850 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-2">
              Appearance Preferences
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Toggle between high-contrast dark theme (recommended for EOC command environments) and light theme.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => store.toggleTheme()}
              className={`flex-1 py-2.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                store.theme === 'dark'
                  ? 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60 shadow-lg'
                  : 'bg-transparent text-gray-400 border-gray-850 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Theme</span>
            </button>
            <button
              onClick={() => store.toggleTheme()}
              className={`flex-1 py-2.5 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                store.theme === 'light'
                  ? 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60 shadow-lg'
                  : 'bg-transparent text-gray-400 border-gray-850 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Theme</span>
            </button>
          </div>
        </GlassCard>

        {/* Profile Info */}
        <GlassCard className="p-5 border border-gray-850">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 flex items-center">
            <User className="w-4 h-4 text-cyan-400 mr-2" />
            User Operator Session
          </h2>

          <div className="space-y-3 font-semibold text-xs text-gray-300">
            <div className="flex justify-between py-2 border-b border-gray-850/60">
              <span className="text-gray-500">Username</span>
              <span className="text-white">{store.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-850/60">
              <span className="text-gray-500">Assigned Role</span>
              <span className="text-cyan-400 uppercase font-mono tracking-wider">{store.role}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">EOC Access</span>
              <span className="text-emerald-400 flex items-center font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                ACTIVE SECURE SESSION
              </span>
            </div>
          </div>
        </GlassCard>

        {/* System Endpoint Check */}
        <GlassCard className="p-5 border border-gray-850">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 flex items-center">
            <Server className="w-4 h-4 text-cyan-400 mr-2" />
            Backend Connection
          </h2>

          <div className="space-y-3 font-semibold text-xs text-gray-300">
            <div className="flex justify-between py-2 border-b border-gray-850/60">
              <span className="text-gray-500">FastAPI Host</span>
              <span className="font-mono text-gray-400">127.0.0.1:8000</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-850/60">
              <span className="text-gray-500">MongoDB Clusters</span>
              <span className="font-mono text-gray-400">Atlas ResQNet</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">AI LLM Model</span>
              <span className="font-mono text-cyan-400">
                {useCloudAi ? `Cloud LLM (${cloudAiModelName})` : 'LM Studio Local Server'}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default SettingsPage;
