// frontend/src/Charts.tsx
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar
} from 'recharts';

// --- TYPE DEFINITIONS ---
interface DashboardMetric {
    date: string; 
    revenue: string; 
    units_sold: number;
    cost_of_goods: string;
    profit: string; 
    product_category?: string;
    region?: string;
}

interface ChartProps {
    data: DashboardMetric[];
}

// FIX: Define a specific interface for an item within the Recharts payload
interface RechartsPayloadItem {
    dataKey: 'revenue' | 'profit'; 
    name: string;
    value: number;
    color?: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: RechartsPayloadItem[]; 
    label?: string;
}

// Define interfaces for bar chart data and tooltip
interface CategoryData {
    category: string;
    revenue: number;
    profit: number;
}

interface BarChartTooltipProps {
    active?: boolean;
    payload?: Array<{
        dataKey: string;
        name: string;
        value: number;
        color: string;
    }>;
    label?: string;
}

// --- UTILITY ---
// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white border border-gray-200 shadow-lg rounded-lg text-sm">
                <p className="font-semibold text-gray-700 mb-1">{`Date: ${label}`}</p>
                {payload.map((p, index: number) => (
                    <p key={index} className={`font-medium ${p.dataKey === 'profit' ? 'text-green-600' : 'text-blue-600'}`}>
                        {`${p.name}: GH₵${p.value.toLocaleString()}`} {/* Changed $ to GH₵ */}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Custom Tooltip for Bar Chart
const BarChartTooltip = ({ active, payload, label }: BarChartTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white border border-gray-200 shadow-lg rounded-lg text-sm">
                <p className="font-semibold text-gray-700 mb-1">{`Category: ${label}`}</p>
                {payload.map((p, index: number) => (
                    <p key={index} className={`font-medium ${p.dataKey === 'profit' ? 'text-green-600' : 'text-blue-600'}`}>
                        {`${p.name}: GH₵${Number(p.value).toLocaleString()}`} {/* Changed $ to GH₵ */}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// 1. Revenue & Profit Trend Chart
export const RevenueProfitChart = ({ data }: ChartProps) => {
    // Format the data for the chart by converting currency strings to numbers
    const chartData = data.map(item => ({
        date: item.date,
        revenue: parseFloat(item.revenue.replace(/[^0-9.-]+/g, "")), 
        profit: parseFloat(item.profit.replace(/[^0-9.-]+/g, "")), 
    }));

    return (
        <div className="h-96 w-full p-4 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Revenue and Profit Trends</h3>
            <ResponsiveContainer width="100%" height="85%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: '#9ca3af' }} />
                    <YAxis tickFormatter={(value) => `GH₵${value.toFixed(0)}`}  axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    
                    {/* Revenue Area */}
                    <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6"
                        fill="#60a5fa"
                        fillOpacity={0.6}
                        name="Total Revenue"
                    />

                    {/* Profit Area */}
                    <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#10b981"
                        fill="#34d399"
                        fillOpacity={0.6}
                        name="Net Profit"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// 2. Category Performance Bar Chart
export const CategoryBarChart = ({ data }: ChartProps) => {
    // Aggregate data by category
    const categoryData = data.reduce((acc: CategoryData[], item) => {
        // Skip items without category
        if (!item.product_category) return acc;
        
        const existing = acc.find(cat => cat.category === item.product_category);
        const revenue = parseFloat(item.revenue.replace(/[^0-9.-]+/g, ""));
        const profit = parseFloat(item.profit.replace(/[^0-9.-]+/g, ""));
        
        if (existing) {
            existing.revenue += revenue;
            existing.profit += profit;
        } else {
            acc.push({
                category: item.product_category,
                revenue: revenue,
                profit: profit
            });
        }
        return acc;
    }, []);

    // Sort by revenue (descending)
    categoryData.sort((a, b) => b.revenue - a.revenue);

    return (
        <div className="h-96 w-full p-4 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance by Category</h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                        dataKey="category" 
                        tickLine={false} 
                        axisLine={{ stroke: '#9ca3af' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis 
                        tickFormatter={(value) => `GH₵${value.toFixed(0)}`} 
                        axisLine={false} 
                        tickLine={false} 
                    />
                    <Tooltip content={<BarChartTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// 3. Region Performance Chart (Placeholder for future implementation)
// export const RegionPieChart = ({ data }: ChartProps) => {
//     // This would require additional imports and implementation
//     // You can add this later if you want
//     return null;
// };