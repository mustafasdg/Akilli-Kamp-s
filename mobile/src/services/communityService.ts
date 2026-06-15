import apiClient from './apiClient';
import { Community, CommunityMessage } from '../types/Community';

export const communityService = {
  /** GET /api/communities/discover — kullanıcının HENÜZ ÜYE OLMADIĞI topluluklar. */
  getDiscoverCommunities: async (): Promise<Community[]> => {
    const res = await apiClient.get<Community[]>('/communities/discover');
    return res.data;
  },

  /** GET /api/communities/my — kullanıcının ÜYE OLDUĞU topluluklar. */
  getMyCommunities: async (): Promise<Community[]> => {
    const res = await apiClient.get<Community[]>('/communities/my');
    return res.data;
  },

  /** GET /api/communities/all — sistemdeki TÜM topluluklar (yalnızca admin). */
  getAllCommunities: async (): Promise<Community[]> => {
    const res = await apiClient.get<Community[]>('/communities/all');
    return res.data;
  },

  /** PUT /api/communities/{id} — topluluğu günceller (yalnızca admin). */
  updateCommunity: async (
    id: number,
    data: { name: string; description: string; imageUrl?: string },
  ): Promise<Community> => {
    const res = await apiClient.put<Community>(`/communities/${id}`, data);
    return res.data;
  },

  /** DELETE /api/communities/{id} — topluluğu siler (üyelik + mesajlar dahil, yalnızca admin). */
  deleteCommunity: async (id: number): Promise<void> => {
    await apiClient.delete(`/communities/${id}`);
  },

  /** POST /api/communities/{id}/join — kullanıcıyı topluluğa üye yapar. */
  joinCommunity: async (communityId: number): Promise<void> => {
    await apiClient.post(`/communities/${communityId}/join`);
  },

  /** POST /api/communities — yeni topluluk oluşturur (yalnızca admin). */
  createCommunity: async (
    data: { name: string; description: string; imageUrl?: string },
  ): Promise<Community> => {
    const res = await apiClient.post<Community>('/communities', data);
    return res.data;
  },

  /** GET /api/communities/{id}/messages — topluluğun geçmiş mesajları (kronolojik). */
  getCommunityMessages: async (communityId: number): Promise<CommunityMessage[]> => {
    const res = await apiClient.get<CommunityMessage[]>(`/communities/${communityId}/messages`);
    return res.data;
  },
};
