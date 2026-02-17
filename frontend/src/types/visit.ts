export interface Visit {
  _id: string;
  userId: {
    _id: string;
    email: string;
    username?: string;
    avatarUrl?: string;
  };
  trainerId?: {
    _id: string;
    email: string;
    username?: string;
    avatarUrl?: string;
    role: string;
  };
  date: string;
  price?: number;
  notes?: string;
  wasBalanceUsed: boolean;
  balanceId?: string;
  createdAt: string;
}

export interface VisitForm {
  userId: string;
  trainerId?: string;
  date: Date;
  price: number | null;
  notes: string;
  useBalance: boolean;
}

export interface CreateVisitRequest {
  userId: string;
  trainerId?: string;
  date?: string;
  price?: number;
  notes?: string;
  useBalance?: boolean;
}

export interface VisitStats {
  totalVisits: number;
  revenue: number;
  balanceVisits: number;
  paidVisits: number;
}

export interface VisitsResponse {
  success: boolean;
  data: Visit[];
  total?: number;
  pagination?: {
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}
