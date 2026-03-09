
import React from 'react';
import { ChartDataPoint } from '../types';

interface FinancialChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ data, title, subtitle }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 100000);
  const padding = 50;
  const width = 1000;
  const height = 300;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  const formatShortAmount = (cents: number) => {
    const rands = cents / 100;
    if (rands >= 1000) {
      return `R${(rands / 1000).toFixed(1)}k`;
    }
    return `R${Math.round(rands)}`;
  };

  const getPoints = () => {
    return data.map((d, i) => {
      const x = padding + (i * (chartWidth / (data.length - 1)));
      const y = height - padding - ((d.value / maxValue) * chartHeight);
      return { x, y, val: d.value, label: d.label };
    });
  };

  const createBezierPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const points = getPoints();
  const pathData = createBezierPath(points);

  // Filter labels to prevent overlap on high-density charts (like daily)
  const labelFrequency = data.length > 20 ? 4 : data.length > 15 ? 2 : 1;

  const averageValue = data.length 
    ? data.reduce((sum, d) => sum + d.value, 0) / data.length 
    : 0;

  return (
    <div className="w-full bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title || 'Financial Performance'}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subtitle || 'Revenue Intelligence Tracking'}</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none mb-1">Average Revenue</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-blue-600 tracking-tighter">
                {formatShortAmount(averageValue)}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Revenue Flow</span>
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <line 
              key={i}
              x1={padding} 
              y1={height - padding - (p * chartHeight)} 
              x2={width - padding} 
              y2={height - padding - (p * chartHeight)} 
              stroke="#f1f5f9" 
              strokeWidth="1"
            />
          ))}

          {/* Area under path */}
          <path 
            d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
            fill="url(#rev-gradient)"
            className="opacity-10"
          />

          <defs>
            <linearGradient id="rev-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Revenue Path */}
          <path d={pathData} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points and Data Labels */}
          {points.map((p, i) => (
            <g key={`point-${i}`} className="group/point">
              {/* Point Anchor */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="3" 
                fill="white" 
                stroke="#2563eb" 
                strokeWidth="1.5" 
                className="transition-all hover:r-5 cursor-pointer"
              />
              
              {/* Tooltip on Hover */}
              <g className="opacity-0 group-hover/point:opacity-100 transition-opacity">
                <rect x={p.x - 30} y={p.y - 35} width="60" height="22" rx="6" fill="#1e293b" />
                <text x={p.x} y={p.y - 20} textAnchor="middle" className="text-[9px] font-bold fill-white">
                  {formatShortAmount(p.val)}
                </text>
              </g>

              {/* Month/Day/Week Label (X-axis) */}
              {i % labelFrequency === 0 && (
                <text 
                  x={p.x} 
                  y={height - 20} 
                  textAnchor="middle" 
                  className="text-[9px] font-black fill-slate-400 uppercase tracking-tighter"
                >
                  {p.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default FinancialChart;
