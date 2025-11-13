// frontend/src/App.tsx
import { useState, useCallback, useEffect, useRef } from 'react'; // Add useRef import
import { format, subDays } from 'date-fns';
import { LogOut, Settings, Download, Repeat2 } from 'lucide-react';
import Dashboard from './Dashboard';
import Analytics from './pages/Analytics';
import AdminPanel from './components/AdminPanel';
import { useToast } from './hooks/useToast';
import { Toast } from './components/Toast';

// --- TYPE DEFINITIONS ---
type AuthView = 'login' | 'register' | 'home';

interface DashboardMetric {
    date: string; 
    revenue: string; 
    units_sold: number;
    cost_of_goods: string;
    profit: string; 
    product_category?: string;
    region?: string;
}

interface FilterParams {
  startDate: string;
  endDate: string;
  category?: string;
  region?: string;
}

// --- CONFIGURATION ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- UTILITY COMPONENTS ---

// Enhanced Header Component
const AppHeader = ({ 
  currentPage, 
  setCurrentPage, 
  handleLogout, 
  handleDataRefresh, 
  onExportData,
  isRefreshing 
}: {
  currentPage: 'dashboard' | 'analytics';
  setCurrentPage: (page: 'dashboard' | 'analytics') => void;
  handleLogout: () => void;
  handleDataRefresh: () => void;
  onExportData: () => void;
  isRefreshing: boolean;
}) => {
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAdminPanel(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-blue-700">
                BI Dashboard
              </h1>
              <nav className="flex space-x-1">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    currentPage === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentPage('analytics')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    currentPage === 'analytics'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Analytics
                </button>
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAdminPanel(true)}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                aria-label="Admin panel"
              >
                <Settings className="h-5 w-5" />
              </button>

              <button
                onClick={handleDataRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-lg ${
                  isRefreshing 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                aria-label="Refresh data"
              >
                <Repeat2 className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={onExportData}
                className="flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <AdminPanel 
        isVisible={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        onDataUpdate={handleDataRefresh}
      />
    </>
  );
};

// --- SCREENS ---
const HomeScreen = ({ onProceed }: { onProceed: () => void }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="max-w-xl w-full text-center bg-white p-12 rounded-2xl shadow-2xl hover:shadow-blue-600/50">
                <h1 className="text-5xl font-extrabold text-blue-600 mb-4 tracking-tight">
                    📊 BI Dashboard Pro
                </h1>
                <p className="text-2xl text-gray-700 mb-6 font-light">
                    Your secure portal for <strong>data-driven decision making.</strong>
                </p>
                <p className="text-gray-500 mb-10 border-t pt-4">
                    Access real-time metrics, performance trends, and secure analytics reports.
                </p>
                <button
                    onClick={onProceed}
                    className="w-full py-3 px-4 border border-transparent rounded-lg shadow-xl text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500/50 transition duration-300 transform hover:scale-[1.01]"
                >
                    Access Dashboard
                </button>
            </div>
        </div>
    );
};

const AuthForm = ({
    currentView,
    handleViewChange,
    handleSubmit,
    email,
    setEmail,
    password,
    setPassword,
    isSubmitting,
}: {
    currentView: AuthView;
    handleViewChange: (view: AuthView) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    isSubmitting: boolean;
}) => {
    const title = currentView === 'login' ? 'Welcome Back' : 'Create Account';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-2xl">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">{title}</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="user@example.com"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 disabled:opacity-50"
                    >
                        {isSubmitting
                            ? 'Processing...'
                            : currentView === 'login'
                                ? 'Sign In'
                                : 'Register'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    {currentView === 'login' ? (
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <button
                                onClick={() => handleViewChange('register')}
                                className="font-medium text-blue-600 hover:text-blue-700 focus:outline-none transition duration-150"
                            >
                                Register now
                            </button>
                        </p>
                    ) : (
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <button
                                onClick={() => handleViewChange('login')}
                                className="font-medium text-blue-600 hover:text-blue-700 focus:outline-none transition duration-150"
                            >
                                Sign in
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN APPLICATION ---
const App = () => {
    const [currentView, setCurrentView] = useState<AuthView>('home');
    const [currentPage, setCurrentPage] = useState<'dashboard' | 'analytics'>('dashboard');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
    const [dashboardData, setDashboardData] = useState<DashboardMetric[]>([]);
    const [filters, setFilters] = useState<FilterParams>({
        startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { toast, triggerToast } = useToast();
    
    // Refs for tracking state
    const initialLoadRef = useRef(false);
    const refreshIntervalRef = useRef<number | null>(null); // Use number instead of NodeJS.Timeout for broader compatibility

    const handleViewChange = useCallback((view: AuthView) => {
        setCurrentView(view);
        if (view === 'login' || view === 'register') {
            setEmail('');
            setPassword('');
        }
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setDashboardData([]);
        setEmail('');
        setPassword('');
        setCurrentView('home');
        setCurrentPage('dashboard');
        triggerToast('info', 'You have been logged out.');
    }, [triggerToast]);

    const loadDashboardData = useCallback(async (showToast = true) => {
      const token = localStorage.getItem('token');
      if (!token) {
        triggerToast('error', 'Authentication token missing. Please log in.');
        handleLogout();
        return;
      }

      // Create cache key from filters
      const cacheKey = `dashboard_${JSON.stringify(filters)}`;
      
      // Try cache first
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData && !showToast) { // Only use cache for silent refreshes
        const cacheItem = JSON.parse(cachedData);
        // Check if cache is still valid (2 minutes)
        if (Date.now() - cacheItem.timestamp < 2 * 60 * 1000) {
          setDashboardData(cacheItem.data);
          return;
        }
      }

      try {
        const queryParams = new URLSearchParams();
        queryParams.append('startDate', filters.startDate);
        queryParams.append('endDate', filters.endDate);
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.region) queryParams.append('region', filters.region);

        console.log('Fetching dashboard data with params:', Object.fromEntries(queryParams));

        const response = await fetch(`${API_BASE_URL}/api/dashboard/data?${queryParams}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please log in again.');
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch dashboard data.');
        }

        const data = await response.json();
        console.log('Dashboard data received:', data.data?.length, 'records');
        setDashboardData(data.data || []);
        
        // Cache the response
        const cacheItem = {
          data: data.data || [],
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
        
        if (showToast) {
          triggerToast('success', `Dashboard data loaded successfully.`);
        }
      } catch (error: unknown) {
        console.error("Data fetch error:", error);
        triggerToast('error', (error as Error).message);
        if ((error as Error).message.includes('expired') || (error as Error).message.includes('unauthorized')) {
          handleLogout();
        }
        // Set empty array on error to prevent loading state hang
        setDashboardData([]);
      }
    }, [filters, triggerToast, handleLogout]);

    // Fix 1: Data loading on authentication
    useEffect(() => {
      if (isAuthenticated && !initialLoadRef.current) {
        console.log('User authenticated, loading dashboard data...');
        initialLoadRef.current = true;
        loadDashboardData();
      } else if (!isAuthenticated) {
        initialLoadRef.current = false;
        setCurrentView('home');
      }
    }, [isAuthenticated, loadDashboardData]);

    // Fix 2: Auto-refresh - use a ref to track the interval
    useEffect(() => {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      if (isAuthenticated && currentPage === 'dashboard') {
        console.log('Setting up auto-refresh for dashboard');
        refreshIntervalRef.current = window.setInterval(() => {
          loadDashboardData(false); // Silent refresh (no toast)
        }, 30000); // Refresh every 30 seconds
      }

      return () => {
        if (refreshIntervalRef.current) {
          console.log('Clearing auto-refresh interval');
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }, [isAuthenticated, currentPage, loadDashboardData]);

    useEffect(() => {
        if (isAuthenticated) {
            loadDashboardData();
        } else {
            setCurrentView('home');
        }
    }, [isAuthenticated, loadDashboardData]);

    const handleExportData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const queryParams = new URLSearchParams();
            queryParams.append('startDate', filters.startDate);
            queryParams.append('endDate', filters.endDate);
            if (filters.category) queryParams.append('category', filters.category);
            if (filters.region) queryParams.append('region', filters.region);

            const response = await fetch(`${API_BASE_URL}/api/dashboard/export?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                triggerToast('success', 'Data exported successfully!');
            } else {
                throw new Error('Export failed');
            }
        } catch (error: unknown) {
            console.error('Export error:', error);
            triggerToast('error', 'Failed to export data.');
        }
    }, [filters, triggerToast]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        triggerToast('info', 'Processing request...');
        setIsSubmitting(true);

        const endpoint = currentView === 'login' ? '/api/login' : '/api/register';

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    setIsAuthenticated(true);
                    triggerToast('success', 'Login successful! Redirecting...');
                } else {
                    handleViewChange('login');
                    triggerToast('success', data.message || 'Registration successful! Please log in.');
                }
            } else {
                throw new Error(data.message || 'An error occurred during authentication.');
            }
        } catch (error) {
            console.error("Auth error:", error);
            triggerToast('error', (error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDataRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadDashboardData(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    }, [loadDashboardData]);

    let content;
    const authViews: AuthView[] = ['login', 'register'];

    if (isAuthenticated) {
        content = (
            <div className="min-h-screen bg-gray-50">
                <AppHeader
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    handleLogout={handleLogout}
                    handleDataRefresh={handleDataRefresh}
                    onExportData={handleExportData}
                    isRefreshing={isRefreshing}
                />

                <main>
                    {currentPage === 'dashboard' && (
                        <Dashboard 
                            dashboardData={dashboardData} 
                            onFiltersChange={setFilters}
                            filters={filters}
                            isLoading={isRefreshing || dashboardData.length === 0}
                        />
                    )}
                    {currentPage === 'analytics' && (
                        <Analytics dashboardData={dashboardData} />
                    )}
                </main>
            </div>
        );
    } else if (currentView === 'home') {
        content = <HomeScreen onProceed={() => handleViewChange('login')} />;
    } else if (authViews.includes(currentView)) {
        content = (
            <AuthForm
                currentView={currentView}
                handleViewChange={handleViewChange}
                handleSubmit={handleSubmit}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                isSubmitting={isSubmitting}
            />
        );
    }

    return (
        <>
            <Toast {...toast} />
            {content}
        </>
    );
};

export default App;