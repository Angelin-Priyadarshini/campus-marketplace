import { useEffect, useRef, useState, useCallback } from 'react'
import { getAccessToken } from '../api/client'

export function useWebSocket(onMessage) {
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectDelayRef = useRef(1000)
  const [isConnected, setIsConnected] = useState(false)
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const connect = useCallback(() => {
    const token = getAccessToken()
    if (!token) return
    const ws = new WebSocket(`${WS_URL}/ws/chat?token=${token}`)
    wsRef.current = ws
    ws.onopen = () => {
      setIsConnected(true)
      reconnectDelayRef.current = 1000
    }
    ws.onmessage = (e) => {
      try { onMessageRef.current(JSON.parse(e.data)) } catch {}
    }
    ws.onclose = () => {
      setIsConnected(false)
      const delay = Math.min(reconnectDelayRef.current, 30000)
      reconnectDelayRef.current = delay * 2
      reconnectTimeoutRef.current = setTimeout(connect, delay)
    }
    ws.onerror = () => ws.close()
  }, [WS_URL])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimeoutRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
      return true
    }
    return false
  }, [])

  return { isConnected, sendMessage }
}
