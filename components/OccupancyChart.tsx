
import React from 'react';

interface OccupancyData {
  date: string;
  percentage: number;
}

interface OccupancyChartProps {
  data: OccupancyData[];
  monthName?: string;
}

const OccupancyChart: React.FC<OccupancyChartProps> = ({ data, monthName }) => {
  if (!data.length) return null;

  const padding = 60;
  const width = 1000;
  const height = 300;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  const getPoints = () => {
    return data.map((d, i) => {
      const x = padding + (i * (chartWidth / (data.length - 1)));
      // Clamp percentage to 0-100 to keep line within chart bounds
      const clampedPercentage = Math.min(100, Math.max(0, d.percentage));
      const y = height - padding - ((clampedPercentage / 100) * chartHeight);
      return { x, y, percentage: d.percentage, day: d.date.split('-')[2] };
    });
  };

  const createPath = (points: { x: number; y: number }[]) => {
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
  const pathData = createPath(points);

  const averageOccupancy = data.length 
    ? data.reduce((sum, d) => sum + d.percentage, 0) / data.length 
    : 0;

  return (
    <div className="w-full bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Occupancy Velocity</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Inventory Utilization Trend ({monthName || 'Current Month'})
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none mb-1">Average Utilization</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-blue-600 tracking-tighter">
                {Math.round(averageOccupancy)}%
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Daily % Plot</span>
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <g key={i}>
              <line 
                x1={padding} 
                y1={height - padding - (p * chartHeight)} 
                x2={width - padding} 
                y2={height - padding - (p * chartHeight)} 
                stroke="#f1f5f9" 
                strokeWidth="1"
              />
              <text 
                x={padding - 10} 
                y={height - padding - (p * chartHeight) + 4} 
                textAnchor="end" 
                className="text-[8px] font-black fill-slate-300 uppercase"
              >
                {Math.round(p * 100)}%
              </text>
            </g>
          ))}

          {/* Average Line */}
          <line 
            x1={padding} 
            y1={height - padding - ((averageOccupancy / 100) * chartHeight)} 
            x2={width - padding} 
            y2={height - padding - ((averageOccupancy / 100) * chartHeight)} 
            stroke="#2563eb" 
            strokeWidth="1" 
            strokeDasharray="4 4"
            className="opacity-40"
          />

          {/* Fill Area */}
          <path 
            d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`} 
            fill="url(#gradient-occupancy)" 
            className="opacity-20"
          />

          <defs>
            <linearGradient id="gradient-occupancy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Main Path */}
          <path 
            d={pathData} 
            fill="none" 
            stroke="#2563eb" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Days Labels (X-axis) */}
          {points.filter((_, i) => i % 2 === 0 || i === points.length - 1).map((p, i) => (
            <text 
              key={i}
              x={p.x} 
              y={height - 20} 
              textAnchor="middle" 
              className="text-[9px] font-black fill-slate-400 uppercase tracking-tighter"
            >
              Day {p.day}
            </text>
          ))}

          {/* Interaction Points */}
          {points.map((p, i) => (
            <g key={i} className="group/point">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="3" 
                fill="white" 
                stroke="#2563eb" 
                strokeWidth="1.5" 
                className="transition-all hover:r-5 cursor-pointer"
              />
              <g className="opacity-0 group-hover/point:opacity-100 transition-opacity">
                <rect x={p.x - 20} y={p.y - 35} width="40" height="22" rx="6" fill="#1e293b" />
                <text x={p.x} y={p.y - 20} textAnchor="middle" className="text-[9px] font-bold fill-white">
                  {Math.round(p.percentage)}%
                </text>
              </g>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default OccupancyChart;
