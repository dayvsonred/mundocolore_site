export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  image_url?: string;
  images?: string[];
  image_urls?: string[];
  image_keys?: string[];
  description: string;
  brand: string;
  brand_key?: string;
  collection: string;
  collection_slug?: string;
  year?: string;
  produto_id?: string;
  preco?: string;
  tamanho_original?: string;
  tamanho_inicio?: number;
  tamanho_fim?: number;
  tamanhos_array?: number[];
  cores?: string[];
  is_active?: boolean;
  release_date?: string;
  finalization_date?: string;
  type: string;
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
