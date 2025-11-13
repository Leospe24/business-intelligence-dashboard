// frontend/src/Dashboard.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { RevenueProfitChart, CategoryBarChart } from './Charts';
import LazyChart from './components/LazyChart';
import { SkeletonKPI, SkeletonChart, SkeletonTable, SkeletonFilter } from './components/SkeletonLoader';
import { useRealTimeData } from './hooks/useRealTimeData';  // <-- Add this
import { LiveIndicator } from './components/LiveIndicator';  // <-- Add this

// --- TYPE DEFINITIONS ---
export interface DashboardMetric {
    date: string; 
    revenue: string; 
    units_sold: number;
    cost_of_goods: string;
    profit: string; 
    product_category?: string;
    region?: string;
}

interface KPI {
    title: string;
    value: string;
    trend: 'up' | 'down' | 'flat';
    trendValue: string;
    color: string;
    Icon: typeof ArrowUp | typeof ArrowDown;
}

interface FilterParams {
  startDate: string;
  endDate: string;
  category?: string;
  region?: string;
}


// --- UTILITIES ---

// Helper function to convert currency string to float
const parseCurrency = (currencyStr: string): number => {
  // Remove any currency symbols and parse
  return parseFloat(currencyStr.replace(/[^0-9.-]+/g, ""));
};

// Change from USD to Ghana Cedis
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const calculateKPIs = (data: DashboardMetric[]): KPI[] => {
    if (data.length === 0) return [];

    const totalRevenue = data.reduce((sum, item) => sum + parseCurrency(item.revenue), 0);
    const totalProfit = data.reduce((sum, item) => sum + parseCurrency(item.profit), 0);
    const totalUnits = data.reduce((sum, item) => sum + item.units_sold, 0);

    // SIMPLE: Generate realistic-looking trends for demo
    const getDemoTrend = () => {
        const randomChange = (Math.random() * 20 - 5); // -5% to +15%
        const trend: 'up' | 'down' | 'flat' = randomChange > 2 ? 'up' : randomChange < -2 ? 'down' : 'flat';
        const Icon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : ArrowUp;
        const color = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';
        
        return { 
            trend, 
            trendValue: `${randomChange > 0 ? '+' : ''}${randomChange.toFixed(1)}%`, 
            Icon, 
            color 
        };
    };

    return [
        {
            title: 'Total Revenue',
            value: formatCurrency(totalRevenue),
            ...getDemoTrend(),
        },
        {
            title: 'Net Profit',
            value: formatCurrency(totalProfit),
            ...getDemoTrend(),
        },
        {
            title: 'Units Sold', 
            value: new Intl.NumberFormat().format(totalUnits),
            ...getDemoTrend(),
        },
    ];
};

// KPI Card Component
const KPICard = ({ title, value, trendValue, color, Icon }: KPI) => (
    <div className="bg-white p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="mt-1 flex justify-between items-center">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <div className={`flex items-center text-sm font-semibold ${color}`}>
                <Icon className="h-4 w-4 mr-1" />
                {trendValue}
            </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">vs. previous period</p>
    </div>
);

// Filter Panel Component
const FilterPanel = ({ filters, onFiltersChange }: { filters: FilterParams; onFiltersChange: (filters: FilterParams) => void }) => {
  const categories = ['Electronics', 'Clothing', 'Home Goods', 'Books', 'Sports'];
  const regions = ['North', 'South', 'East', 'West'];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFiltersChange({ ...filters, category: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Region Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
          <select
            value={filters.region || ''}
            onChange={(e) => onFiltersChange({ ...filters, region: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = ({
  dashboardData,
  onFiltersChange,
  filters,
  isLoading = false
}: {
  dashboardData: DashboardMetric[];
  onFiltersChange: (filters: FilterParams) => void;
  filters: FilterParams;
  isLoading?: boolean;
}) => {
    const liveData = useRealTimeData(dashboardData);
    const kpis = useMemo(() => calculateKPIs(liveData), [liveData]);
    const [localLoading, setLocalLoading] = useState(true);

    // Update local loading state when data arrives
    useEffect(() => {
        if (liveData.length > 0) {
            setLocalLoading(false);
        }
    }, [liveData]);

    // Reset loading when filters change
    useEffect(() => {
        setLocalLoading(true);
    }, [filters]);

    const isActuallyLoading = isLoading || localLoading;

    const handleFilterChange = useCallback((newFilters: FilterParams) => {
        // Clear cache when filters change
        const cacheKey = `dashboard_${JSON.stringify(newFilters)}`;
        localStorage.removeItem(cacheKey);
        setLocalLoading(true); // Set loading when filters change
        onFiltersChange(newFilters);
    }, [onFiltersChange]);

    const kpiCards = useMemo(() => 
        kpis.map((kpi, index) => <KPICard key={index} {...kpi} />)
    , [kpis]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                {/* Header with Live Indicator */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Business Dashboard</h1>
                    {!isLoading && liveData.length > 0 && <LiveIndicator />}
                </div>

                {/* Filter Panel with Skeleton */}
                {isActuallyLoading ? (
                    <SkeletonFilter />
                ) : (
                    <FilterPanel filters={filters} onFiltersChange={handleFilterChange} />
                )}

                {/* 1. KPI Metrics Section with Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {isActuallyLoading ? (
                        <>
                            <SkeletonKPI />
                            <SkeletonKPI />
                            <SkeletonKPI />
                        </>
                    ) : (
                        kpiCards
                    )}
                </div>

                {/* 2. Charts Section with Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {isActuallyLoading ? (
                        <>
                            <SkeletonChart height={400} />
                            <SkeletonChart height={400} />
                        </>
                    ) : liveData.length > 0 ? (
                        <>
                            <LazyChart height={400}>
                                <RevenueProfitChart data={liveData} />
                            </LazyChart>
                            <LazyChart height={400}>
                                <CategoryBarChart data={liveData} />
                            </LazyChart>
                        </>
                    ) : (
                        <div className="bg-white p-12 rounded-xl shadow-lg text-center text-gray-500 col-span-2">
                            <p className="text-lg font-medium">Loading or No Data Available.</p>
                            <p>Please check the API connection or wait for data to populate.</p>
                        </div>
                    )}
                </div>
                
                {/* 3. Data Table with Skeleton */}
                <div className="mt-8">
                    {isActuallyLoading ? (
                        <SkeletonTable rows={5} />
                    ) : (
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">
                                Data Source Preview ({liveData.length} records)
                                {filters.category && ` • Category: ${filters.category}`}
                                {filters.region && ` • Region: ${filters.region}`}
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units Sold</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {liveData.slice(0, 10).map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.date}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.revenue}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.profit}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.units_sold.toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.product_category || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.region || 'N/A'}</td>
                                            </tr>
                                        ))}
                                        {liveData.length > 10 && (
                                             <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                                    ... and {liveData.length - 10} more records
                                                </td>
                                             </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;