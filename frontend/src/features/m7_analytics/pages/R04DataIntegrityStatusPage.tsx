import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi, type IntegrityCheckResponse } from '../api'
import { StatCard } from '../../../components/ui/StatCard'
import { Card } from '../../../components/ui/Card'
import { StatusPill } from '../../../components/ui/StatusPill'
import { Button } from '../../../components/ui/Button'
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../../components/ui/ErrorState'

export function R04DataIntegrityStatusPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['integrityChecks'],
    queryFn: analyticsApi.getIntegrityChecks,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Data Integrity Status</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton height={120} />
          <LoadingSkeleton height={120} />
          <LoadingSkeleton height={120} />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorState message="Failed to load integrity checks" onRetry={refetch} />
  }

  const passedCount = data.filter(c => c.status === 'PASS').length
  const warningCount = data.filter(c => c.status === 'WARN').length
  const failedCount = data.filter(c => c.status === 'FAIL').length

  // Group by module
  const grouped = data.reduce((acc, curr) => {
    if (!acc[curr.module]) acc[curr.module] = []
    acc[curr.module].push(curr)
    return acc
  }, {} as Record<string, IntegrityCheckResponse[]>)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Data Integrity Status</h1>
        <Button onClick={() => refetch()} isLoading={isFetching}>Run Checks</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Checks Passed" icon={<div/>} value={passedCount} />
        <StatCard label="Warnings" icon={<div/>} value={warningCount} />
        <StatCard label="Failed" icon={<div/>} value={failedCount} />
      </div>

      <div className="space-y-8 mt-8">
        {Object.entries(grouped).map(([module, checks]) => (
          <div key={module}>
            <h2 className="text-xl font-semibold mb-4 capitalize">{module.toLowerCase()} Module</h2>
            <div className="space-y-4">
              {(checks as IntegrityCheckResponse[]).map((check, idx) => (
                <Card key={idx}>
                  <div className="p-4 flex flex-col md:flex-row justify-between md:items-center">
                    <div>
                      <div className="flex items-center space-x-4">
                        <StatusPill 
                          status={check.status === 'PASS' ? 'success' : check.status === 'WARN' ? 'warning' : 'error'} 
                          label={check.status} 
                        />
                        <h3 className="font-semibold text-lg">{check.check_name}</h3>
                      </div>
                      
                      {check.status !== 'PASS' && (
                        <div className="mt-4 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          <p><span className="font-medium">Affected Records:</span> {check.affected_count}</p>
                          {check.sample_keys && (
                            <p className="mt-1"><span className="font-medium">Sample Keys:</span> {check.sample_keys}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
