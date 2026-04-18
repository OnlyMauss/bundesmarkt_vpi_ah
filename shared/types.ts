export type Category = {
  id: string;
  name: string;
  description: string;
};

export type Company = {
  id: string;
  categoryId: string;
  name: string;
  hq: string;
  founded?: number;
};

export type ProductType = {
  id: string;
  categoryId: string;
  name: string;
};

export type Product = {
  id: string;
  categoryId: string;
  companyId: string;
  typeId: string;
  name: string;
  sku: string;
  priceDm: number;
  yearModel?: number;
  details: string;
};

export type CartLine = {
  productId: string;
  qty: number;
};

export type OrderPayload = {
  buyerRpName: string;
  discordHandle: string;
  deliveryNote: string;
  lines: { productId: string; name: string; qty: number; unitPriceDm: number }[];
};
