export interface Balance {
  id: string;
  visits: number;
  dueDate: string;
  isExpired: boolean;
  purchaseDate: string;
}

export interface BalanceForm {
  visits: number;
  dueDate: Date;
  price: number | null;
  notes: string;
}
