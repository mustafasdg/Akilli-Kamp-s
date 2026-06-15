// GET /api/communities/discover  |  GET /api/communities/my
export interface Community {
  id: number;
  name: string;
  description: string;
  /** Topluluk kapak görseli (opsiyonel). */
  imageUrl?: string;
  /** Backend'in hesapladığı toplam üye sayısı. */
  memberCount: number;
}

// GET /api/communities/{id}/messages  &  SignalR "ReceiveMessage" event
export interface CommunityMessage {
  id: number;
  content: string;
  sentAt: string; // ISO 8601
  senderId: number;
  senderName: string;
}
