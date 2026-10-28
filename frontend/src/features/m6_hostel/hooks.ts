import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import { toast } from 'react-hot-toast'

// --- Hostels ---
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

export const useDeleteHostel = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteHostel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] })
      queryClient.invalidateQueries({ queryKey: ['occupancy'] })
      toast.success('Hostel deleted successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete hostel')
  })
}

// --- Rooms ---
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

export const useDeleteRoom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['occupancy'] })
      toast.success('Room deleted successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete room')
  })
}

// --- Occupancy ---
export const useOccupancy = () => {
  return useQuery({
    queryKey: ['occupancy'],
    queryFn: api.getOccupancy
  })
}

// --- Allocations ---
export const useAllocations = (params?: { hostel_id?: number; room_id?: number; status?: string; search?: string }) => {
  return useQuery({
    queryKey: ['allocations', params],
    queryFn: () => api.getAllocations(params)
  })
}

export const useAllocateRoom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.allocateRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['occupancy'] })
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
      queryClient.invalidateQueries({ queryKey: ['my_hostel'] })
      queryClient.invalidateQueries({ queryKey: ['integrity_guardian'] })
      toast.success('Room & bed allocated successfully')
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
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
      queryClient.invalidateQueries({ queryKey: ['my_hostel'] })
      queryClient.invalidateQueries({ queryKey: ['integrity_guardian'] })
      toast.success('Room vacated successfully. Available beds updated.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to vacate room')
  })
}

export const useTransferRoom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ allocId, data }: { allocId: number; data: { new_room_id: number; new_bed_number?: string } }) =>
      api.transferRoom(allocId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['occupancy'] })
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
      queryClient.invalidateQueries({ queryKey: ['my_hostel'] })
      toast.success('Room transfer completed successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to transfer room')
  })
}

export const useMyHostel = () => {
  return useQuery({
    queryKey: ['my_hostel'],
    queryFn: api.getMyHostel,
    retry: false
  })
}

// --- Requests ---
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
      toast.success('Application submitted successfully')
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
    mutationFn: ({ id, data }: { id: number; data: { status: api.RequestStatus; remark?: string } }) =>
      api.decideRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_requests'] })
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
      queryClient.invalidateQueries({ queryKey: ['occupancy'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      toast.success('Request decision recorded')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to record decision')
  })
}

// --- Complaints ---
export const useMyComplaints = () => {
  return useQuery({
    queryKey: ['my_complaints'],
    queryFn: api.getMyComplaints
  })
}

export const useAllComplaints = (params?: { hostel_id?: number; status?: string }) => {
  return useQuery({
    queryKey: ['all_complaints', params],
    queryFn: () => api.getAllComplaints(params)
  })
}

export const useCreateComplaint = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createComplaint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_complaints'] })
      toast.success('Complaint ticket logged')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to log ticket')
  })
}

export const useUpdateComplaintStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status?: api.ComplaintStatus; priority?: api.ComplaintPriority; assigned_to?: string; resolution_notes?: string } }) =>
      api.updateComplaintStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_complaints'] })
      queryClient.invalidateQueries({ queryKey: ['my_complaints'] })
      toast.success('Ticket status updated')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update ticket')
  })
}

// --- Notices ---
export const useNotices = (hostel_id?: number) => {
  return useQuery({
    queryKey: ['notices', hostel_id],
    queryFn: () => api.getNotices(hostel_id ? { hostel_id } : undefined)
  })
}

export const useCreateNotice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      toast.success('Notice published successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to publish notice')
  })
}

// --- Outpasses ---
export const useMyOutpasses = () => {
  return useQuery({
    queryKey: ['my_outpasses'],
    queryFn: api.getMyOutpasses
  })
}

export const useAllOutpasses = (status?: string) => {
  return useQuery({
    queryKey: ['all_outpasses', status],
    queryFn: () => api.getAllOutpasses(status ? { status } : undefined)
  })
}

export const useCreateOutpass = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createOutpass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_outpasses'] })
      toast.success('Outpass request submitted')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to submit outpass')
  })
}

export const useDecideOutpass = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: api.RequestStatus; decision_remark?: string } }) =>
      api.decideOutpass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_outpasses'] })
      toast.success('Outpass decision recorded')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to record decision')
  })
}

// --- Signature Features Hooks ---
export const useIntegrityGuardian = () => {
  return useQuery({
    queryKey: ['integrity_guardian'],
    queryFn: api.getIntegrityGuardianReport
  })
}

export const useMyJourney = () => {
  return useQuery({
    queryKey: ['my_journey'],
    queryFn: api.getMyHostelJourney
  })
}

export const useStudentJourney = (studentId?: number) => {
  return useQuery({
    queryKey: ['student_journey', studentId],
    queryFn: () => api.getStudentHostelJourney(studentId!),
    enabled: !!studentId
  })
}

// Inspections Hooks
export const useInspections = (roomId?: number) => {
  return useQuery({
    queryKey: ['inspections', roomId],
    queryFn: () => api.getInspections({ room_id: roomId }),
    enabled: roomId !== undefined ? true : true
  })
}

export const useCreateInspection = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] })
      toast.success('Inspection record logged')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to log inspection')
  })
}

// Waitlist Hooks
export const useWaitlist = (params?: { hostel_id?: number; status?: string }) => {
  return useQuery({
    queryKey: ['waitlist', params],
    queryFn: () => api.getWaitlist(params)
  })
}

export const useCreateWaitlist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createWaitlistEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      toast.success('Student added to waitlist')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add to waitlist')
  })
}

export const useUpdateWaitlistStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: api.WaitlistStatus; notes?: string } }) =>
      api.updateWaitlistStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      toast.success('Waitlist entry updated')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update waitlist entry')
  })
}

// Visitor Desk Hooks
export const useVisitors = (params?: { hostel_id?: number }) => {
  return useQuery({
    queryKey: ['visitors', params],
    queryFn: () => api.getVisitors(params)
  })
}

export const useRegisterVisitor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.registerVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] })
      toast.success('Visitor registered & Gate Pass issued')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to register visitor')
  })
}

export const useRecordVisitorExit = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { exit_time?: string } }) =>
      api.recordVisitorExit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] })
      toast.success('Visitor departure logged')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to log visitor departure')
  })
}

// --- Minimal Hostel Fee Management Hooks ---
export const useHostelFeeSummary = () => {
  return useQuery({
    queryKey: ['hostel-fees', 'summary'],
    queryFn: api.getHostelFeeSummary
  })
}

export const useHostelFeeConfigs = (hostelId?: number) => {
  return useQuery({
    queryKey: ['hostel-fees', 'configs', hostelId],
    queryFn: () => api.getHostelFeeConfigs(hostelId)
  })
}

export const useCreateHostelFeeConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createHostelFeeConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostel-fees'] })
      toast.success('Fee structure saved')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create fee configuration')
  })
}

export const useHostelInvoices = (params?: { student_id?: number; hostel_id?: number; status_val?: string }) => {
  return useQuery({
    queryKey: ['hostel-fees', 'invoices', params],
    queryFn: () => api.getHostelInvoices(params)
  })
}

export const useGenerateBatchInvoices = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (feeConfigId?: number) => api.generateBatchHostelInvoices(feeConfigId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hostel-fees'] })
      toast.success(`Generated ${data.invoices_generated} invoices (${data.skipped_existing} skipped)`)
    },
    onError: (err: any) => toast.error(err.message || 'Batch invoice generation failed')
  })
}

export const useAllHostelPayments = (params?: { invoice_id?: number; student_id?: number; status_val?: string }) => {
  return useQuery({
    queryKey: ['hostel-fees', 'payments', params],
    queryFn: () => api.getAllHostelPayments(params)
  })
}

export const useVerifyHostelPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: number; data: { status: 'VERIFIED' | 'REJECTED'; verification_notes?: string } }) =>
      api.verifyHostelPayment(paymentId, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['hostel-fees'] })
      toast.success(vars.data.status === 'VERIFIED' ? 'Payment verified successfully' : 'Payment marked as rejected')
    },
    onError: (err: any) => toast.error(err.message || 'Verification failed')
  })
}

export const useMyHostelInvoices = () => {
  return useQuery({
    queryKey: ['my-hostel-fees', 'invoices'],
    queryFn: api.getMyHostelInvoices
  })
}

export const usePayMyHostelFee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.payMyHostelFee,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-hostel-fees'] })
      queryClient.invalidateQueries({ queryKey: ['hostel-fees'] })
      if (data.status === 'VERIFIED') {
        toast.success('Demo payment confirmed and receipt generated!')
      } else {
        toast.success('Payment submitted for warden desk verification')
      }
    },
    onError: (err: any) => toast.error(err.message || 'Payment submission failed')
  })
}

export const useMyHostelPayments = () => {
  return useQuery({
    queryKey: ['my-hostel-fees', 'payments'],
    queryFn: api.getMyHostelPayments
  })
}
