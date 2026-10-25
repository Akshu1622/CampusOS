import { apiClient } from '@/api/client'

export type GenderBlock = 'MALE' | 'FEMALE' | 'COED'
export type AllocationStatus = 'ACTIVE' | 'VACATED'
export type RequestType = 'ALLOCATION' | 'ROOM_CHANGE' | 'VACATE'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Hostel {
  id: number
  name: string
  gender_block: GenderBlock
  total_capacity: number
}

export interface Room {
  id: number
  hostel_id: number
  room_number: string
  bed_capacity: number
  available_beds: number
}

export interface HostelAllocation {
  id: number
  student_id: number
  room_id: number
  from_date: string
  to_date: string | null
  status: AllocationStatus
}

export interface HostelRequest {
  id: number
  student_id: number
  request_type: RequestType
  details: string | null
  status: RequestStatus
  decision_by: number | null
  remark: string | null
  created_at?: string
  reviewer_notes?: string
}

export interface HostelOccupancy {
  hostel_id: number
  hostel_name: string
  gender_block: GenderBlock
  total_capacity: number
  occupied_beds: number
  available_beds: number
  occupancy_pct: number | null
}

// --- API Calls ---

export const getHostels = () => apiClient<Hostel[]>('/hostels')
export const createHostel = (data: Partial<Hostel>) => apiClient<Hostel>('/hostels', { data })
export const updateHostel = (id: number, data: Partial<Hostel>) => apiClient<Hostel>(`/hostels/${id}`, { method: 'PUT', data })
export const deleteHostel = (id: number) => apiClient<void>(`/hostels/${id}`, { method: 'DELETE' })

export const getRooms = (params?: { hostel_id?: number }) => apiClient<Room[]>('/rooms', { params })
export const createRoom = (data: Partial<Room>) => apiClient<Room>('/rooms', { data })
export const updateRoom = (id: number, data: Partial<Room>) => apiClient<Room>(`/rooms/${id}`, { method: 'PUT', data })
export const deleteRoom = (id: number) => apiClient<void>(`/rooms/${id}`, { method: 'DELETE' })

export const getOccupancy = () => apiClient<HostelOccupancy[]>('/hostels/occupancy')

export const allocateRoom = (data: { student_id: number; room_id: number; from_date: string; to_date?: string }) => apiClient<HostelAllocation>('/hostel-allocations', { data })
export const vacateRoom = (alloc_id: number) => apiClient<HostelAllocation>(`/hostel-allocations/${alloc_id}/vacate`, { method: 'PATCH' })

export const getMyHostel = () => apiClient<HostelAllocation>('/me/hostel')

export const createMyRequest = (data: { request_type: RequestType; details?: string }) => apiClient<HostelRequest>('/hostel-requests', { data })
export const getMyRequests = (params?: { status?: RequestStatus }) => apiClient<HostelRequest[]>('/me/hostel-requests', { params })

export const getAllRequests = (params?: { status?: RequestStatus }) => apiClient<HostelRequest[]>('/hostel-requests', { params })
export const decideRequest = (id: number, data: { status: RequestStatus; remark?: string }) => apiClient<HostelRequest>(`/hostel-requests/${id}/decision`, { method: 'PATCH', data })

export const getStudents = () => apiClient<any>('/students?page_size=1000').then((res: any) => res.items || [])
