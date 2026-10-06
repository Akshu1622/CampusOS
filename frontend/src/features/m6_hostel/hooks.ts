import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import { toast } from 'react-hot-toast'

export const useHostels = () => {
  return useQuery({
    queryKey: ['hostels'],
    queryFn: api.getHostels
  })
}

export const useCreateHostel = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createHostel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] })
      queryClient.invalidateQueries({ queryKey: ['occupancy'] })
      toast.success('Hostel created successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create hostel')
  })
}

export const useUpdateHostel = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<api.Hostel> }) => api.updateHostel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] })
      queryClient.invalidateQueries({ queryKey: ['occupancy'] })
      toast.success('Hostel updated successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update hostel')
  })
}

export const useRooms = (hostel_id?: number) => {
  return useQuery({
    queryKey: ['rooms', hostel_id],
    queryFn: () => api.getRooms(hostel_id ? { hostel_id } : undefined)
  })
}

export const useCreateRoom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['occupancy'] })
      toast.success('Room created successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create room')
  })
}

export const useUpdateRoom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<api.Room> }) => api.updateRoom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['occupancy'] })
      toast.success('Room updated successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update room')
  })
}

export const useOccupancy = () => {
  return useQuery({
    queryKey: ['occupancy'],
    queryFn: api.getOccupancy
  })
}

export const useAllocateRoom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.allocateRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['occupancy'] })
      queryClient.invalidateQueries({ queryKey: ['my_hostel'] })
      toast.success('Room allocated successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to allocate room')
  })
}

export const useVacateRoom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.vacateRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['occupancy'] })
      queryClient.invalidateQueries({ queryKey: ['my_hostel'] })
      toast.success('Room vacated successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to vacate room')
  })
}

export const useMyHostel = () => {
  return useQuery({
    queryKey: ['my_hostel'],
    queryFn: api.getMyHostel,
    retry: false
  })
}

export const useMyRequests = (status?: api.RequestStatus) => {
  return useQuery({
    queryKey: ['my_requests', status],
    queryFn: () => api.getMyRequests(status ? { status } : undefined)
  })
}

export const useCreateMyRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createMyRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_requests'] })
      toast.success('Request submitted successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to submit request')
  })
}

export const useAllRequests = (status?: api.RequestStatus) => {
  return useQuery({
    queryKey: ['all_requests', status],
    queryFn: () => api.getAllRequests(status ? { status } : undefined)
  })
}

export const useDecideRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: api.RequestStatus; remark?: string } }) => api.decideRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_requests'] })
      toast.success('Request decision recorded')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to record decision')
  })
}
