import { env } from '@/lib/env'

interface FetchOptions extends RequestInit {
  data?: unknown
  params?: Record<string, string | number | boolean | undefined>
}

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, params, headers: customHeaders, ...customConfig } = options

  const token = localStorage.getItem('access_token')

  const headers: HeadersInit = {
    ...customHeaders,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (data) {
    headers['Content-Type'] = 'application/json'
  }

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    ...customConfig,
    headers,
  }

  if (data) {
    config.body = JSON.stringify(data)
  }

  let url = `${env.API_BASE_URL}/api/v1${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  let response = await fetch(url, config)

  if (response.status === 401 && token) {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      localStorage.removeItem('access_token')
      window.location.href = '/session-expired'
      return Promise.reject(new Error('Session expired'))
    }

    if (!isRefreshing) {
      isRefreshing = true
      try {
        const refreshResponse = await fetch(`${env.API_BASE_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        
        if (!refreshResponse.ok) {
          throw new Error('Refresh failed')
        }

        const refreshData = await refreshResponse.json()
        localStorage.setItem('access_token', refreshData.access_token)
        localStorage.setItem('refresh_token', refreshData.refresh_token)
        
        isRefreshing = false
        onRefreshed(refreshData.access_token)
      } catch (err) {
        isRefreshing = false
        refreshSubscribers = []
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/session-expired'
        return Promise.reject(err)
      }
    }

    return new Promise((resolve, reject) => {
      addRefreshSubscriber((newToken) => {
        // Retry the original request
        headers['Authorization'] = `Bearer ${newToken}`
        fetch(url, { ...config, headers })
          .then(async (res) => {
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}))
              reject(errData)
            } else {
              resolve(await res.json())
            }
          })
          .catch(reject)
      })
    })
  }

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      errorData = { message: 'An unknown error occurred' }
    }
    return Promise.reject(errorData)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  // Handle blob responses (e.g., CSV export)
  if (response.headers.get('content-type')?.includes('text/csv')) {
    return response.blob() as unknown as T
  }

  return response.json()
}
