export type OrderStatus =
  | "CREATED"
  | "PENDING"
  | "ACCEPTED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export interface Order {
  id: string;
  status: OrderStatus;
  // ajoute d'autres champs si tu les utilises
}