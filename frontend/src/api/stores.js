import client from './client'
export const storesApi = {
  create: (data) => client.post('/stores', data),
  get: (id) => client.get(`/stores/${id}`),
  updateMe: (data) => client.patch('/stores/me', data),
  getReviews: (id, params) => client.get(`/stores/${id}/reviews`, { params }),
}
