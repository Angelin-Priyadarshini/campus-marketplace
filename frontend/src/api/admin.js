import client from './client'
export const adminApi = {
  getReports: (params) => client.get('/admin/reports', { params }),
  resolveReport: (id, data) => client.post(`/admin/reports/${id}/resolve`, data),
  getUsers: (params) => client.get('/admin/users', { params }),
  createUser: (data) => client.post('/admin/users', data),
  suspendUser: (id) => client.post(`/admin/users/${id}/suspend`),
  unsuspendUser: (id) => client.post(`/admin/users/${id}/unsuspend`),
  getListings: (params) => client.get('/admin/listings', { params }),
  hideListings: (id) => client.post(`/admin/listings/${id}/hide`),
  restoreListings: (id) => client.post(`/admin/listings/${id}/restore`),
  hideListing: (id) => client.post(`/admin/listings/${id}/hide`),
  restoreListing: (id) => client.post(`/admin/listings/${id}/restore`),
  getCategories: () => client.get('/admin/categories'),
  createCategory: (data) => client.post('/admin/categories', data),
  updateCategory: (id, data) => client.patch(`/admin/categories/${id}`, data),
  deleteCategory: (id) => client.delete(`/admin/categories/${id}`),
  getStats: () => client.get('/admin/stats'),
}
