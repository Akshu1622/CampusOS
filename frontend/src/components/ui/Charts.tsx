import React from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)'
]

interface BaseChartProps {
  data: any[]
  height?: number
}

interface LineChartProps extends BaseChartProps {
  lines: { key: string; name: string; color?: string }[]
  xAxisKey: string
}

export function TrendChart({ data, lines, xAxisKey, height = 300 }: LineChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
            labelStyle={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {lines.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color || CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface BarChartProps extends BaseChartProps {
  bars: { key: string; name: string; color?: string; stackId?: string }[]
  xAxisKey: string
  layout?: 'horizontal' | 'vertical'
}

export function GroupedBarChart({ data, bars, xAxisKey, layout = 'horizontal', height = 300 }: BarChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} layout={layout} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={layout === 'horizontal'} vertical={layout === 'vertical'} stroke="var(--color-border)" />
          <XAxis 
            dataKey={layout === 'horizontal' ? xAxisKey : undefined} 
            type={layout === 'horizontal' ? 'category' : 'number'}
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} 
            axisLine={false} tickLine={false} 
          />
          <YAxis 
            dataKey={layout === 'vertical' ? xAxisKey : undefined}
            type={layout === 'vertical' ? 'category' : 'number'}
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} 
            axisLine={false} tickLine={false} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
            cursor={{ fill: 'var(--color-surface-muted)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              stackId={bar.stackId}
              fill={bar.color || CHART_COLORS[index % CHART_COLORS.length]}
              radius={layout === 'horizontal' ? [4, 4, 0, 0] : [0, 4, 4, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface DonutChartProps extends BaseChartProps {
  dataKey: string
  nameKey: string
}

export function DonutChart({ data, dataKey, nameKey, height = 300 }: DonutChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
            itemStyle={{ color: 'var(--color-text-primary)' }}
          />
          <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
