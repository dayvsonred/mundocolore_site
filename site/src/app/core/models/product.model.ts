export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  images?: string[];
  description: string;
  category: string;
  size: string[];
  ageGroup: string;
  isNew?: boolean;
  isPromotion?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: string;
  customer: Customer;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  address: Address;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}