export interface CartItem {
  productId:        string;
  variantId:        string;
  sku:              string;
  name:             string;
  slug:             string;
  thumbnail:        string | null;
  price:            number;
  comparePrice:     number | null;
  quantity:         number;
  stock:            number;
  attributes:       { key: string; value: string }[];
  isWholesalePrice: boolean;
  wholesaleMinQty:  number | null;
}

export interface Cart {
  userId:    string;
  items:     CartItem[];
  updatedAt: string;
}

export interface CartSummary extends Cart {
  subtotal:   number;
  totalItems: number;
  savings:    number;
}
