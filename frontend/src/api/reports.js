import client from './client'
export const reportsApi = {
  create: (data) => client.post('/reports', data),
}
