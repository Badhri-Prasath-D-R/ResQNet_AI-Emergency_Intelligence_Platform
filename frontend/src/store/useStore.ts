import { create } from 'zustand';

export interface Incident {
  _id: string;
  title: string;
  description: string;
  incident_type: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  ai_summary?: string;
  urgency: string;
  people_affected: number;
  medical_severity: number;
  vulnerability_score: number;
  ai_confidence: number;
  status: string;
  assigned_resources: Array<{
    resource_id: string;
    resource_type: string;
    quantity: number;
  }>;
  explanation?: string;
  recommended_resources?: Array<{
    type: string;
    quantity: number;
  }>;
  broadcast_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  _id: string;
  resource_type: string;
  name: string;
  quantity: number;
  availability: number;
  location: {
    type: string;
    coordinates: [number, number];
  };
  deployment_status: string;
  cost_per_unit: number;
}

export interface Shelter {
  _id: string;
  name: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  capacity: number;
  occupancy: number;
  available_beds: number;
}

export interface Station {
  _id: string;
  name: string;
  station_type: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
}

export interface DispatchLog {
  _id: string;
  incident_id: string;
  resource_id: string;
  resource_type: string;
  quantity: number;
  responder_name: string;
  route: {
    type: string;
    coordinates: Array<[number, number]>;
  };
  eta_minutes: number;
  dispatched_at: string;
  arrived_at?: string;
  completed_at?: string;
  status: string;
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type?: 'info' | 'warning' | 'critical';
}

interface AppState {
  // Auth
  token: string | null;
  username: string | null;
  role: string | null;
  login: (token: string, username: string, role: string) => void;
  logout: () => void;

  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Core Data
  incidents: Incident[];
  resources: Resource[];
  shelters: Shelter[];
  stations: Station[];
  dispatchHistory: DispatchLog[];
  activeIncident: Incident | null;
  
  // Dashboard KPIs
  kpis: {
    total_incidents: number;
    critical_incidents: number;
    active_responders: number;
    resources_available: number;
    avg_response_time_min: number;
    dispatch_success_rate: number;
  };

  // Simulation Status
  simulationStatus: 'stopped' | 'running' | 'paused';
  
  // Notifications
  alerts: AlertNotification[];
  addAlert: (title: string, message: string, type?: 'info' | 'warning' | 'critical') => void;
  dismissAlert: (id: string) => void;

  // Filters & Map Control
  filters: {
    type: string;
    urgency: string;
    status: string;
  };
  setFilter: (key: 'type' | 'urgency' | 'status', value: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Command Palette
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;

  // View Navigation
  currentView: 'dashboard' | 'map' | 'resources' | 'dispatch' | 'history' | 'settings';
  setCurrentView: (view: AppState['currentView']) => void;
  dispatchIncident: Incident | null;
  setDispatchIncident: (incident: Incident | null) => void;

  // Setters
  setIncidents: (incidents: Incident[]) => void;
  setResources: (resources: Resource[]) => void;
  setShelters: (shelters: Shelter[]) => void;
  setStations: (stations: Station[]) => void;
  setDispatchHistory: (history: DispatchLog[]) => void;
  setActiveIncident: (incident: Incident | null) => void;
  setKPIs: (kpis: AppState['kpis']) => void;
  setSimulationStatus: (status: AppState['simulationStatus']) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Auth defaults from localStorage
  token: localStorage.getItem('resqnet_token'),
  username: localStorage.getItem('resqnet_username'),
  role: localStorage.getItem('resqnet_role'),
  login: (token, username, role) => {
    localStorage.setItem('resqnet_token', token);
    localStorage.setItem('resqnet_username', username);
    localStorage.setItem('resqnet_role', role);
    set({ token, username, role });
  },
  logout: () => {
    localStorage.removeItem('resqnet_token');
    localStorage.removeItem('resqnet_username');
    localStorage.removeItem('resqnet_role');
    set({ token: null, username: null, role: null, activeIncident: null });
  },

  // Theme
  theme: (localStorage.getItem('resqnet_theme') as 'dark' | 'light') || 'dark',
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('resqnet_theme', newTheme);
    const root = window.document.documentElement;
    if (newTheme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    set({ theme: newTheme });
  },

  // Core Data
  incidents: [],
  resources: [],
  shelters: [],
  stations: [],
  dispatchHistory: [],
  activeIncident: null,

  // KPI default values
  kpis: {
    total_incidents: 0,
    critical_incidents: 0,
    active_responders: 0,
    resources_available: 0,
    avg_response_time_min: 12.5,
    dispatch_success_rate: 100.0
  },

  // Simulation
  simulationStatus: 'stopped',

  // Alert Notifications
  alerts: [],
  addAlert: (title, message, type = 'info') => {
    const newAlert: AlertNotification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      timestamp: new Date().toLocaleTimeString(),
      type
    };
    set({ alerts: [newAlert, ...get().alerts].slice(0, 10) }); // Cap at 10 alerts
  },
  dismissAlert: (id) => {
    set({ alerts: get().alerts.filter(alert => alert.id !== id) });
  },

  // Filters
  filters: {
    type: '',
    urgency: '',
    status: ''
  },
  setFilter: (key, value) => {
    set({ filters: { ...get().filters, [key]: value } });
  },
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  // Command Palette
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),

  // View Navigation
  currentView: 'dashboard',
  setCurrentView: (currentView) => set({ currentView }),
  dispatchIncident: null,
  setDispatchIncident: (dispatchIncident) => set({ dispatchIncident }),

  // Setters
  setIncidents: (incidents) => set({ incidents }),
  setResources: (resources) => set({ resources }),
  setShelters: (shelters) => set({ shelters }),
  setStations: (stations) => set({ stations }),
  setDispatchHistory: (dispatchHistory) => set({ dispatchHistory }),
  setActiveIncident: (activeIncident) => set({ activeIncident }),
  setKPIs: (kpis) => set({ kpis }),
  setSimulationStatus: (simulationStatus) => set({ simulationStatus }),
}));
