interface DonutProgressProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  bg?: string;
}

export default function DonutProgress({ 
  value, 
  size = 48, 
  stroke = 6, 
  color = '#000000', 
  bg = '#e5e7eb' 
}: DonutProgressProps) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value));
  
  return (
    <svg width={size} height={size} className="block" style={{ minWidth: size, minHeight: size }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bg}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.22}
        fill="#374151"
        fontWeight="bold"
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
} 