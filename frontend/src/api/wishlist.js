import client from './client'
export const wishlistApi = {
  list: () => client.get('/wishlist'),
  add: (listingId) => client.post(`/wishlist/${listingId}`),
  remove: (listingId) => client.delete(`/wishlist/${listingId}`),
}
