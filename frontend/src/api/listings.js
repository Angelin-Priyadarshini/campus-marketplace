import client from './client'
export const listingsApi = {
  list: (params) => client.get('/listings', { params }),
  get: (id) => client.get(`/listings/${id}`),
  similar: (id) => client.get(`/listings/${id}/similar`),
  create: (data) => client.post('/listings', data),
  update: (id, data) => client.patch(`/listings/${id}`, data),
  delete: (id) => client.delete(`/listings/${id}`),
  uploadImages: (id, files) => {
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    return client.post(`/listings/${id}/images`, fd)
  },
  deleteImage: (id, imageId) => client.delete(`/listings/${id}/images/${imageId}`),
  reorderImages: (id, positions) => client.put(`/listings/${id}/images/order`, { positions }),
  myListings: (params) => client.get('/listings/me/listings', { params }),
}
