import client from './client'
export const notificationsApi = {
  list: (params) => client.get('/notifications', { params }),
  markRead: (ids) => client.post('/notifications/read', ids ? { ids } : {}),
}
