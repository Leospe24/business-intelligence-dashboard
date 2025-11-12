// frontend/src/components/AdminPanel.tsx
import { useState } from 'react';
import { Settings, Plus, RotateCcw, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface AdminPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onDataUpdate: () => void;
}

const AdminPanel = ({ isVisible, onClose, onDataUpdate }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'data' | 'modify'>('scenarios');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const callAdminEndpoint = async (endpoint: string, data: Record<string, unknown> = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showMessage('Authentication required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (response.ok) {
        showMessage(result.message || 'Operation successful!');
        onDataUpdate(); // Refresh dashboard data
      } else {
        showMessage(result.message || 'Operation failed');
      }
    } catch (error) {
      showMessage('Error calling admin endpoint');
      console.error('Admin API error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pre-built scenarios
  const scenarios = [
    {
      id: 'revenue-spike',
      name: 'Revenue Spike',
      description: '50% Revenue Spike in Electronics',
      icon: TrendingUp,
      action: () => callAdminEndpoint('/api/admin/apply-scenario', { scenario: 'revenue-spike' })
    },
    {
      id: 'profit-drop',
      name: 'Profit Drop',
      description: '30% Profit Drop in Clothing',
      icon: TrendingDown,
      action: () => callAdminEndpoint('/api/admin/apply-scenario', { scenario: 'profit-drop' })
    },
    {
      id: 'category-leader',
      name: 'Category Leader',
      description: 'Make Sports Category the Leader',
      icon: Zap,
      action: () => callAdminEndpoint('/api/admin/apply-scenario', { scenario: 'category-leader' })
    },
    {
      id: 'regional-boom',
      name: 'Regional Boom',
      description: 'West Region Business Boom',
      icon: TrendingUp,
      action: () => callAdminEndpoint('/api/admin/apply-scenario', { scenario: 'regional-boom' })
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Admin Controls</h2>
                <p className="text-blue-100">Manage dashboard data and scenarios</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'scenarios' as const, name: 'Pre-built Scenarios' },
              { id: 'data' as const, name: 'Data Management' },
              { id: 'modify' as const, name: 'Custom Modifiers' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[400px] overflow-y-auto">
          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {message}
            </div>
          )}

          {activeTab === 'scenarios' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={scenario.action}
                  disabled={loading}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <scenario.icon className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{scenario.name}</h3>
                      <p className="text-sm text-gray-600">{scenario.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => callAdminEndpoint('/api/admin/reset-data')}
                  disabled={loading}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 flex items-center space-x-3"
                >
                  <RotateCcw className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Reset to Default</h3>
                    <p className="text-sm text-gray-600">Restore original sample data</p>
                  </div>
                </button>

                <button
                  onClick={() => callAdminEndpoint('/api/admin/generate-data', { 
                    records: 100, 
                    scenario: 'growth' 
                  })}
                  disabled={loading}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 flex items-center space-x-3"
                >
                  <Plus className="h-6 w-6 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Generate Growth Data</h3>
                    <p className="text-sm text-gray-600">100 records with growth scenario</p>
                  </div>
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Quick Data Scenarios</h4>
                <div className="flex flex-wrap gap-2">
                  {['normal', 'growth', 'recession', 'spike'].map((scenario) => (
                    <button
                      key={scenario}
                      onClick={() => callAdminEndpoint('/api/admin/generate-data', {
                        records: 50,
                        scenario
                      })}
                      disabled={loading}
                      className="px-3 py-1 bg-white border border-yellow-300 rounded text-sm text-yellow-700 hover:bg-yellow-100 transition-colors"
                    >
                      {scenario}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modify' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">Custom Multipliers</h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Revenue Multiplier
                    </label>
                    <select
                      id="revenueMultiplier"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      defaultValue="1.0"
                    >
                      <option value="0.5">0.5x (Half)</option>
                      <option value="1.0">1.0x (Normal)</option>
                      <option value="1.5">1.5x (50% Increase)</option>
                      <option value="2.0">2.0x (Double)</option>
                      <option value="3.0">3.0x (Triple)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profit Multiplier
                    </label>
                    <select
                      id="profitMultiplier"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      defaultValue="1.0"
                    >
                      <option value="0.5">0.5x (Half)</option>
                      <option value="1.0">1.0x (Normal)</option>
                      <option value="1.5">1.5x (50% Increase)</option>
                      <option value="2.0">2.0x (Double)</option>
                      <option value="3.0">3.0x (Triple)</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const revenueMultiplier = parseFloat(
                      (document.getElementById('revenueMultiplier') as HTMLSelectElement)?.value || '1.0'
                    );
                    const profitMultiplier = parseFloat(
                      (document.getElementById('profitMultiplier') as HTMLSelectElement)?.value || '1.0'
                    );
                    callAdminEndpoint('/api/admin/modify-data', {
                      revenueMultiplier,
                      profitMultiplier
                    });
                  }}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Apply Multipliers to All Data
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Add Single Record</h4>
                <button
                  onClick={() => {
                    // For now, just show a message - you can expand this to a form
                    showMessage('Single record addition - expand this section to add a form');
                  }}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Add New Sales Record (Expandable)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {loading ? 'Processing...' : 'Ready to manage data'}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;