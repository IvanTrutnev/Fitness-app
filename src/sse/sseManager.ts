import type { Response } from 'express';

export interface SseNotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

class SseManagerClass {
  private clients = new Map<string, Set<Response>>();

  add(userId: string, res: Response) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(res);
  }

  remove(userId: string, res: Response) {
    const set = this.clients.get(userId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) {
      this.clients.delete(userId);
    }
  }

  sendToUser(userId: string, payload: SseNotificationPayload) {
    const set = this.clients.get(userId);
    if (!set || set.size === 0) return;

    const data = `data: ${JSON.stringify(payload)}\n\n`;

    for (const res of set) {
      try {
        res.write(data);
      } catch {
        set.delete(res);
      }
    }
  }

  getConnectionCount(userId?: string): number {
    if (userId) {
      return this.clients.get(userId)?.size ?? 0;
    }
    let total = 0;
    for (const set of this.clients.values()) {
      total += set.size;
    }
    return total;
  }
}

export const SSEManager = new SseManagerClass();
