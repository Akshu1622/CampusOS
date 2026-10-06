import React, { useEffect } from 'react'
import { Card, Button, Input, Select } from '@/components/ui'
import { useCreateMyRequest, useMyHostel, useHostels } from '../hooks'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { RequestType } from '../api'

const requestSchema = z.object({
  request_type: z.enum(['ALLOCATION', 'ROOM_CHANGE', 'VACATE']),
  details: z.string().optional()
})

export function S05NewHostelRequestPage() {
  const [searchParams] = useSearchParams()
  const defaultType = (searchParams.get('type') as RequestType) || 'ALLOCATION'
  
  const { data: allocation, isLoading: allocLoading } = useMyHostel()
  const { data: hostels = [] } = useHostels()
  const createRequest = useCreateMyRequest()
  const navigate = useNavigate()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: { request_type: defaultType, details: '' }
  })

  const selectedType = watch('request_type')

  useEffect(() => {
    if (!allocLoading) {
      if (allocation && allocation.status !== 'VACATED' && selectedType === 'ALLOCATION') {
        setValue('request_type', 'ROOM_CHANGE')
      } else if ((!allocation || allocation.status === 'VACATED') && selectedType !== 'ALLOCATION') {
        setValue('request_type', 'ALLOCATION')
      }
    }
  }, [allocation, allocLoading, selectedType, setValue])

  const onSubmit = (data: any) => {
    createRequest.mutate(data, {
      onSuccess: () => {
        navigate('/student/hostel/requests')
      }
    })
  }

  if (allocLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>

  const hasAllocation = allocation && allocation.status !== 'VACATED'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">New Hostel Request</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a request for hostel accommodation, room change, or vacating.</p>
      </div>

      {hasAllocation && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm">
            <p className="font-medium">You already have an active allocation.</p>
            <p className="mt-1 opacity-90">You can only request a Room Change or to Vacate your current room.</p>
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Request Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedType === 'ALLOCATION' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'hover:bg-gray-50'} ${hasAllocation ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  <input type="radio" value="ALLOCATION" disabled={hasAllocation} {...register('request_type')} className="text-primary-600 focus:ring-primary-500 h-4 w-4" />
                  <span className="font-medium text-gray-900">New Allocation</span>
                </div>
                <div className="text-xs text-gray-500 ml-7">Request a room in a campus hostel.</div>
              </label>

              <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedType === 'ROOM_CHANGE' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'hover:bg-gray-50'} ${!hasAllocation ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  <input type="radio" value="ROOM_CHANGE" disabled={!hasAllocation} {...register('request_type')} className="text-primary-600 focus:ring-primary-500 h-4 w-4" />
                  <span className="font-medium text-gray-900">Room Change</span>
                </div>
                <div className="text-xs text-gray-500 ml-7">Move to a different room or hostel.</div>
              </label>

              <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedType === 'VACATE' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'hover:bg-gray-50'} ${!hasAllocation ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  <input type="radio" value="VACATE" disabled={!hasAllocation} {...register('request_type')} className="text-primary-600 focus:ring-primary-500 h-4 w-4" />
                  <span className="font-medium text-gray-900">Vacate Room</span>
                </div>
                <div className="text-xs text-gray-500 ml-7">Leave your current hostel allocation.</div>
              </label>
            </div>
            {errors.request_type && <div className="text-sm text-red-500">{errors.request_type.message as string}</div>}
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Additional Details</label>
            
            {(selectedType === 'ALLOCATION' || selectedType === 'ROOM_CHANGE') && (
              <Select 
                label="Preferred Hostel (Optional)" 
                options={[
                  { label: 'No Preference', value: '' },
                  ...hostels.map(h => ({ label: `${h.name} (${h.gender_block})`, value: h.name }))
                ]}
                onChange={(e) => {
                  const currentVal = watch('details') || ''
                  const pref = e.target.value ? `Preference: ${e.target.value}\n` : ''
                  setValue('details', pref + currentVal.replace(/^Preference: .*\n/, ''))
                }}
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
              <textarea 
                {...register('details')} 
                rows={4} 
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                placeholder={selectedType === 'VACATE' ? "Please state the reason for vacating the hostel." : "Any specific requirements (e.g. ground floor for medical reasons)."}
              />
              <p className="text-xs text-gray-500 mt-1">Provide clear justification to help administrators process your request faster.</p>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <Button variant="tertiary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" isLoading={createRequest.isPending}>Submit Request</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
