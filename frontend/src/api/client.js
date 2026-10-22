import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

let accessToken = null
let isRefreshing = false
let refreshSubscribers = []

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    // Don't intercept refresh or login calls — let them fail naturally
    const isAuthCall = originalRequest.url?.includes('/auth/refresh') ||
                       originalRequest.url?.includes('/auth/login')
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthCall) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return client(originalRequest)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
        const newToken = res.data.access_token
        setAccessToken(newToken)
        refreshSubscribers.forEach(s => s.resolve(newToken))
        refreshSubscribers = []
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return client(originalRequest)
      } catch (refreshError) {
        refreshSubscribers.forEach(s => s.reject(refreshError))
        refreshSubscribers = []
        setAccessToken(null)
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default client
