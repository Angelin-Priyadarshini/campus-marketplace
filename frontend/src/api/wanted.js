import client from './client'
export const wantedApi = {
  list: (params) => client.get('/wanted', { params }),
  create: (data) => client.post('/wanted', data),
  close: (id) => client.patch(`/wanted/${id}/close`),
  remove: (id) => client.delete(`/wanted/${id}`),
}
