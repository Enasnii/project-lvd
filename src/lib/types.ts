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
