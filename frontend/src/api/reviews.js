import client from './client'
export const reviewsApi = {
  create: (orderId, data) => client.post(`/orders/${orderId}/reviews`, data),
  update: (id, data) => client.patch(`/reviews/${id}`, data),
  delete: (id) => client.delete(`/reviews/${id}`),
  reply: (id, reply) => client.post(`/reviews/${id}/reply`, { reply }),
}
