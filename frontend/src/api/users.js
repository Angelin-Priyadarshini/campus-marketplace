import client from './client'
export const usersApi = {
  getMe: () => client.get('/users/me'),
  updateMe: (data) => client.patch('/users/me', data),
  uploadAvatar: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return client.post('/users/me/avatar', fd)
  },
  getUser: (id) => client.get(`/users/${id}`),
  blockUser: (id) => client.post(`/users/${id}/block`),
  unblockUser: (id) => client.delete(`/users/${id}/block`),
}
