import client from './client'
export const conversationsApi = {
  create: (listingId) => client.post('/conversations', { listing_id: listingId }),
  list: () => client.get('/conversations'),
  getMessages: (id, params) => client.get(`/conversations/${id}/messages`, { params }),
  sendMessage: (id, body) => client.post(`/conversations/${id}/messages`, { body }),
  markRead: (id) => client.post(`/conversations/${id}/read`),
  unreadCount: () => client.get('/conversations/unread-count'),
}
