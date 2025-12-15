"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type RevenueData = {
    name: string;
    value: number;
};

const COLORS = ["#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#3b82f6"];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-100">
                <p className="text-slate-500 text-sm mb-1">{payload[0].name}</p>
                <p className="text-slate-800 font-bold text-lg">
                    ฿{payload[0].value.toLocaleString()}
                </p>
                <p className="text-slate-400 text-xs">
                    {(payload[0].percent * 100).toFixed(1)}% of revenue
                </p>
            </div>
        );
    }
    return null;
};

const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#1e293b" className="text-sm font-bold">
                {payload.name}
            </text>
            <text x={cx} y={cy} dy={28} textAnchor="middle" fill="#64748b" className="text-xs">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 8}
                outerRadius={outerRadius + 12}
                fill={fill}
                opacity={0.3}
            />
        </g>
    );
};

import { Sector } from "recharts";

export default function WhaleAnalysisChart() {
    const [data, setData] = useState<RevenueData[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<"today" | "7days" | "30days">("today");
    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(undefined);
    };

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/analytics/revenue-by-tier?period=${period}`);
                if (!res.ok) throw new Error("Failed");
                const json = await res.json();
                setData(json);
                const total = json.reduce((sum: number, item: any) => sum + item.value, 0);
                setTotalRevenue(total);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [period]);

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-start mb-2 z-10">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.131A8 8 0 008 8m0 0a8 8 0 00-8 8c0 2.472.345 4.865.99 7.131M8 8a8 8 0 008 8m0 0a8 8 0 01-8 8m0 0a8 8 0 01-8-8m0 0a8 8 0 008-8m0 0h.01" />
                            </svg>
                        </span>
                        Whale Analysis
                    </h3>
                    <p className="text-slate-500 text-sm mt-1 ml-9">Revenue Share by Tier</p>
                </div>

                {/* Simple Period Toggle */}
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="text-xs border-none bg-slate-100 rounded-lg px-2 py-1 text-slate-600 focus:ring-0 cursor-pointer"
                >
                    <option value="today">Today</option>
                    <option value="7days">7 Days</option>
                    <option value="30days">30 Days</option>
                </select>
            </div>

            <div className="flex-1 min-h-[300px] relative z-10 flex items-center justify-center">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20 rounded-xl">
                        <div className="w-8 h-8 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
                    </div>
                )}

                {/* Central Text Overlay - Hidden when hovering */}
                <div
                    className={`absolute inset-0 flex items-center justify-center pb-8 pointer-events-none z-0 transition-opacity duration-200 ${activeIndex !== undefined ? 'opacity-0' : 'opacity-100'}`}
                >
                    <div className="text-center">
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total</p>
                        <p className="text-slate-800 text-xl font-bold">฿{(totalRevenue / 1000).toFixed(1)}k</p>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                            onMouseLeave={onPieLeave}
                            // @ts-ignore
                            activeIndex={activeIndex}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => <span className="text-slate-600 font-medium text-xs ml-1">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Background Decor */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
        </div>
    );
}
