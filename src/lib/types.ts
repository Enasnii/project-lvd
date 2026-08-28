export type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
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

export type SitePage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  showInMenu: boolean;
  menuOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SitePageInput = {
  title: string;
  slug: string;
  content: string;
  published: boolean;
  showInMenu: boolean;
  menuOrder: number;
};

export type PortfolioCategory = 'stickers' | 'autobelettering' | 'car-wrapping' | 'kleding' | 'reclameborden' | 'banners' | 'etiketten' | 'tegeltjes' | 'mokken-bidons-tumblers' | 'overig';

export type PortfolioImage = {
  id: string;
  url: string;
};

export type PortfolioProject = {
  id: string;
  title: string;
  slug: string;
  category: PortfolioCategory;
  description: string;
  images: PortfolioImage[];
  published: boolean;
  featured: boolean;
  date: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type PortfolioProjectInput = Omit<PortfolioProject, 'id' | 'createdAt' | 'updatedAt'>;
