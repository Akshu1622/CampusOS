import React from 'react'
import { Card, Table, type Column, Progress } from '@/components/ui'
import { useOccupancy } from '../hooks'

export function S03HostelOccupancyDashboardPage() {
  const { data: occupancy = [], isLoading } = useOccupancy()

  const totalCapacity = occupancy.reduce((sum, o) => sum + o.total_capacity, 0)
  const totalOccupied = occupancy.reduce((sum, o) => sum + o.occupied_beds, 0)
  const totalAvailable = occupancy.reduce((sum, o) => sum + o.available_beds, 0)
  const overallPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0

  const columns: Column<any>[] = [
    { header: 'Hostel Name', key: 'hostel_name', render: (o) => <span className="font-medium text-gray-900">{o.hostel_name}</span> },
    { header: 'Type', key: 'gender_block' },
    { header: 'Total Beds', key: 'total_capacity' },
    { header: 'Occupied', key: 'occupied_beds' },
    { header: 'Available', key: 'available_beds' },
    { 
      header: 'Occupancy %', 
      key: 'occupancy_pct', 
      render: (o) => (
        <div className="w-32">
          <div className="flex justify-between text-xs mb-1">
            <span>{Math.round(o.occupancy_pct || 0)}%</span>
          </div>
          <Progress value={o.occupancy_pct || 0} variant={(o.occupancy_pct || 0) >= 95 ? 'danger' : 'primary'} size="sm" />
          {(o.occupancy_pct || 0) >= 95 && <div className="text-[10px] text-red-600 mt-1 font-medium">Critical Threshold</div>}
        </div>
      ) 
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Hostel Occupancy</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time occupancy metrics across all campus hostels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-gray-500">Total Bed Capacity</div>
          <div className="text-3xl font-bold mt-2">{totalCapacity}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Currently Occupied</div>
          <div className="text-3xl font-bold mt-2 text-primary-600">{totalOccupied}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Beds Available</div>
          <div className="text-3xl font-bold mt-2 text-green-600">{totalAvailable}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Overall Occupancy</div>
          <div className="text-3xl font-bold mt-2">{overallPct}%</div>
          <Progress value={overallPct} className="mt-2" />
        </Card>
      </div>

      <Card title="Occupancy Details by Hostel" padding="none">
        <Table 
          data={occupancy} 
          columns={columns} 
          keyExtractor={(o) => o.hostel_id.toString()}
          isLoading={isLoading}
          emptyMessage="No hostel occupancy data available."
        />
      </Card>

      <Card title="Occupancy Chart">
        <div className="h-64 flex items-end gap-6 px-4 pb-8 pt-4 border-b border-l border-gray-200">
          {occupancy.map(o => (
            <div key={o.hostel_id} className="flex-1 flex flex-col justify-end items-center group relative">
              <div className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {o.hostel_name}: {o.occupied_beds} / {o.total_capacity} beds
              </div>
              <div className="w-full flex flex-col justify-end items-center h-full">
                {/* Available space */}
                <div 
                  className="w-16 bg-gray-200 rounded-t-md transition-all duration-500 flex items-center justify-center text-xs text-gray-500 overflow-hidden" 
                  style={{ height: `${((o.available_beds / o.total_capacity) || 0) * 100}%` }}
                >
                  {o.available_beds > 0 && o.available_beds}
                </div>
                {/* Occupied space */}
                <div 
                  className={`w-16 ${o.occupancy_pct && o.occupancy_pct >= 95 ? 'bg-red-500' : 'bg-primary-500'} transition-all duration-500 flex items-center justify-center text-xs text-white overflow-hidden`}
                  style={{ height: `${(o.occupancy_pct || 0)}%` }}
                >
                  {o.occupied_beds > 0 && o.occupied_beds}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 font-medium rotate-45 origin-left w-full truncate">{o.hostel_name}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 justify-center mt-8 text-sm text-gray-500">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary-500 rounded-sm"></div> Occupied</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Critical (\u003e95%)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 rounded-sm"></div> Available</div>
        </div>
      </Card>
    </div>
  )
}
