import client from './client'
export const ordersApi = {
  create: (data) => client.post('/orders', data),
  list: (params) => client.get('/orders', { params }),
  get: (id) => client.get(`/orders/${id}`),
  accept: (id) => client.post(`/orders/${id}/accept`),
  reject: (id, reason) => client.post(`/orders/${id}/reject`, { reason }),
  complete: (id) => client.post(`/orders/${id}/complete`),
  cancel: (id) => client.post(`/orders/${id}/cancel`),
}
