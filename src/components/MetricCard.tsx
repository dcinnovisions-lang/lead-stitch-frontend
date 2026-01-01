import { ReactNode } from 'react'

interface Trend {
  positive: boolean
  value: string
}

interface MetricCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: Trend
  subtitle?: string
}

function MetricCard({ title, value, icon, trend, subtitle }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricCard

