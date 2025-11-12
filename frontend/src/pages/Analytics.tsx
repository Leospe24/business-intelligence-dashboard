// frontend/src/pages/Analytics.tsx
import { useState, useEffect } from 'react';
import { RevenueProfitChart, CategoryBarChart } from '../Charts';
import type { DashboardMetric } from '../Dashboard';
import { SkeletonChart, SkeletonMetricCard } from '../components/SkeletonLoader';

interface AnalyticsProps {
  dashboardData: DashboardMetric[];
}

// Add API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Define proper TypeScript interfaces for analytics data
interface GrowthData {
  currentPeriod: {
    revenue: number;
    profit: number;
    units: number;
  };
  previousPeriod: {
    revenue: number;
    profit: number;
    units: number;
  };
  growthRates: {
    revenue: number;
    profit: number;
    units: number;
  };
}

interface CategoryBreakdown {
  product_category: string;
  total_revenue: string;
  total_profit: string;
  total_units: string;
  transaction_count: string;
}

interface TrendsData {
  topPerformer: CategoryBreakdown | null;
  categoryBreakdown: CategoryBreakdown[];
  totalCategories: number;
}

interface ForecastDay {
  date: string;
  forecasted_revenue: number;
  confidence: number;
}

interface ForecastData {
  historical: Array<{ date: string; daily_revenue: string }>;
  forecast: ForecastDay[];
}

interface AnalyticsResponse {
  growth: GrowthData;
  trends: TrendsData;
  forecast: ForecastData;
}

const Analytics = ({ dashboardData }: AnalyticsProps) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'categories' | 'forecast'>('trends');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate if we're in initial loading state
  const isLoading = loading || dashboardData.length === 0;

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const [growthResponse, trendsResponse, forecastResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/analytics/growth?period=month`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/api/analytics/trends`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/api/analytics/forecast`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const growthData = await growthResponse.json();
        const trendsData = await trendsResponse.json();
        const forecastData = await forecastResponse.json();

        setAnalyticsData({
          growth: growthData.data,
          trends: trendsData.data,
          forecast: forecastData.data
        });
      } catch (error) {
        console.error('Analytics data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Advanced Analytics</h1>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'trends' as const, name: 'Trend Analysis' },
                { id: 'categories' as const, name: 'Category Insights' },
                { id: 'forecast' as const, name: 'Revenue Forecast' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'trends' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Revenue & Profit Trends</h2>
              
              {isLoading ? (
                <SkeletonChart height={400} />
              ) : (
                <RevenueProfitChart data={dashboardData} />
              )}
              
              {/* Real Growth Metrics */}
              {isLoading ? (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SkeletonMetricCard />
                  <SkeletonMetricCard />
                  <SkeletonMetricCard />
                </div>
              ) : analyticsData?.growth ? (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Revenue Growth</h3>
                    <p className={`text-2xl font-bold mt-2 ${
                      analyticsData.growth.growthRates.revenue > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analyticsData.growth.growthRates.revenue > 0 ? '+' : ''}
                      {analyticsData.growth.growthRates.revenue.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">vs last period</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800">Profit Growth</h3>
                    <p className={`text-2xl font-bold mt-2 ${
                      analyticsData.growth.growthRates.profit > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analyticsData.growth.growthRates.profit > 0 ? '+' : ''}
                      {analyticsData.growth.growthRates.profit.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">vs last period</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800">Units Growth</h3>
                    <p className={`text-2xl font-bold mt-2 ${
                      analyticsData.growth.growthRates.units > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {analyticsData.growth.growthRates.units > 0 ? '+' : ''}
                      {analyticsData.growth.growthRates.units.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">vs last period</p>
                  </div>
                </div>
              ) : null}

              {loading && !analyticsData && (
                <div className="mt-6 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading analytics data...</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'categories' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Category Performance Analysis</h2>
              
              {isLoading ? (
                <SkeletonChart height={400} />
              ) : (
                <CategoryBarChart data={dashboardData} />
              )}
              
              {/* Real Category Insights */}
              {isLoading ? (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SkeletonMetricCard />
                  <SkeletonMetricCard />
                  <SkeletonMetricCard />
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Top Category</h3>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {analyticsData?.trends?.topPerformer?.product_category || getTopCategory(dashboardData)}
                    </p>
                    <p className="text-sm text-gray-600">by total revenue</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800">Most Profitable</h3>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {getMostProfitableCategory(dashboardData)}
                    </p>
                    <p className="text-sm text-gray-600">highest profit margin</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800">Market Share</h3>
                    <p className="text-2xl font-bold text-purple-600 mt-2">
                      {analyticsData?.trends?.totalCategories || getCategoryCount(dashboardData)}
                    </p>
                    <p className="text-sm text-gray-600">active categories</p>
                  </div>
                </div>
              )}

              {/* Category Performance Table */}
              {isLoading ? (
                <div className="mt-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                  <div className="bg-white rounded-lg shadow animate-pulse">
                    <div className="h-12 bg-gray-100 rounded-t-lg"></div>
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="h-12 border-b border-gray-200 flex items-center px-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6 ml-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6 ml-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/6 ml-4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : analyticsData?.trends?.categoryBreakdown && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Category Performance Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Category</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Revenue</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Profit</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Transactions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {analyticsData.trends.categoryBreakdown.slice(0, 5).map((category, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{category.product_category}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">${parseFloat(category.total_revenue).toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">${parseFloat(category.total_profit).toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{category.transaction_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'forecast' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Revenue Forecast (Next 30 Days)</h2>
              {isLoading ? (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : analyticsData?.forecast ? (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                  <div className="text-center">
                    <p className="text-blue-800 font-medium text-lg">
                      📈 Forecast Analytics Active
                    </p>
                    <p className="text-gray-600 mt-2">
                      Using linear regression on {analyticsData.forecast.historical.length} days of historical data
                    </p>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="font-semibold text-gray-700">Avg Daily Revenue</p>
                        <p className="text-green-600 font-bold text-lg">
                          ${(analyticsData.forecast.forecast.reduce((sum, day) => sum + day.forecasted_revenue, 0) / 30).toFixed(0)}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="font-semibold text-gray-700">Confidence</p>
                        <p className="text-blue-600 font-bold text-lg">
                          {(analyticsData.forecast.forecast[0]?.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="font-semibold text-gray-700">Forecast Period</p>
                        <p className="text-purple-600 font-bold text-lg">30 Days</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="font-semibold text-gray-700">Data Points</p>
                        <p className="text-orange-600 font-bold text-lg">
                          {analyticsData.forecast.historical.length}
                        </p>
                      </div>
                    </div>
                    
                    {/* Sample Forecast Data */}
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-800 mb-3">Sample Forecast Data</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        {analyticsData.forecast.forecast.slice(0, 3).map((day, index) => (
                          <div key={index} className="bg-white p-2 rounded border">
                            <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                            <p className="text-green-600">${day.forecasted_revenue.toFixed(0)}</p>
                            <p className="text-gray-500">{(day.confidence * 100).toFixed(0)}% confidence</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Generating revenue forecast...</p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <p className="text-yellow-800 font-medium">
                    🚧 Forecast data unavailable. Please try refreshing the page.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions with proper typing
interface CategoryStats {
  [key: string]: number;
}

const getTopCategory = (data: DashboardMetric[]): string => {
  const categories = data.reduce((acc: CategoryStats, item) => {
    if (!item.product_category) return acc;
    const revenue = parseFloat(item.revenue.replace(/[^0-9.-]+/g, ""));
    acc[item.product_category] = (acc[item.product_category] || 0) + revenue;
    return acc;
  }, {});
  
  const topCategory = Object.keys(categories).reduce((a, b) => 
    categories[a] > categories[b] ? a : b, 'N/A'
  );
  return topCategory;
};

const getMostProfitableCategory = (data: DashboardMetric[]): string => {
  const categories = data.reduce((acc: CategoryStats, item) => {
    if (!item.product_category) return acc;
    const profit = parseFloat(item.profit.replace(/[^0-9.-]+/g, ""));
    acc[item.product_category] = (acc[item.product_category] || 0) + profit;
    return acc;
  }, {});
  
  const mostProfitable = Object.keys(categories).reduce((a, b) => 
    categories[a] > categories[b] ? a : b, 'N/A'
  );
  return mostProfitable;
};

const getCategoryCount = (data: DashboardMetric[]): number => {
  const uniqueCategories = new Set(data.map(item => item.product_category).filter(Boolean));
  return uniqueCategories.size;
};

export default Analytics;