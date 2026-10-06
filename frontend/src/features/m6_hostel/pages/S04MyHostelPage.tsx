import React from 'react'
import { Card, Button, StatusPill } from '@/components/ui'
import { useMyHostel, useHostels, useRooms } from '../hooks'
import { Link, useNavigate } from 'react-router-dom'

export function S04MyHostelPage() {
  const { data: allocation, isLoading: allocLoading, error } = useMyHostel()
  const { data: hostels = [] } = useHostels()
  const { data: rooms = [] } = useRooms()
  const navigate = useNavigate()

  if (allocLoading) {
    return <div className="p-8 text-center text-gray-500">Loading your hostel details...</div>
  }

  // If there's an error (e.g. 404 because student has no allocation) or no active allocation
  if (error || !allocation || allocation.status === 'VACATED') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Hostel</h1>
        </div>
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">You don't have a hostel allocation</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">You are currently not allocated to any campus hostel. If you need accommodation, please submit a request.</p>
          <Button onClick={() => navigate('/student/hostel/new-request')}>Request Hostel</Button>
        </Card>
      </div>
    )
  }

  const room = rooms.find(r => r.id === allocation.room_id)
  const hostel = room ? hostels.find(h => h.id === room.hostel_id) : undefined

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Hostel</h1>
          <p className="text-sm text-gray-500 mt-1">Your current room allocation details.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/student/hostel/new-request?type=ROOM_CHANGE')}>Request Room Change</Button>
          <Button variant="tertiary" onClick={() => navigate('/student/hostel/new-request?type=VACATE')}>Request Vacate</Button>
        </div>
      </div>

      <Card>
        <div className="flex justify-between items-start mb-6 pb-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1v1H9V7zm5 0h1v1h-1V7zm-5 4h1v1H9v-1zm5 0h1v1h-1v-1zm-3 4H2" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{hostel?.name || 'Loading...'}</h2>
              <div className="text-gray-500 mt-1">{hostel?.gender_block} Block</div>
            </div>
          </div>
          <StatusPill label="Allocated" status="success" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="text-sm text-gray-500 mb-1">Room Number</div>
            <div className="text-xl font-semibold text-gray-900">{room?.room_number || '...'}</div>
            <div className="text-sm text-gray-500 mt-1">{room?.bed_capacity} Seater Room</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Allocated From</div>
            <div className="text-lg font-medium text-gray-900">{new Date(allocation.from_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Contact Warden</div>
            <div className="text-base font-medium text-gray-900">Chief Warden</div>
            <a href="mailto:warden@campusos.edu" className="text-sm text-primary-600 hover:underline mt-1 block">warden@campusos.edu</a>
          </div>
        </div>
      </Card>
      
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3">
        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">
          <strong>Need help?</strong> For any maintenance issues in your room, please contact the hostel office directly. For changing your room or leaving the hostel, use the request buttons above.
        </p>
      </div>
    </div>
  )
}
