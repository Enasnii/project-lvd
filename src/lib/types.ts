export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  createdAt: string;
};

export type ProductInput = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
};

export type ProductRequestInput = {
  name: string;
  email: string;
  phone: string;
  product: string;
  quantity: number;
  date: string;
  message: string;
  imageUrl: string;
};

export type ProductRequestStatus = 'new' | 'in_progress' | 'completed';

export type ProductRequest = ProductRequestInput & {
  id: string;
  createdAt: string;
  status: ProductRequestStatus;
};
