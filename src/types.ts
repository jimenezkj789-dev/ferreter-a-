export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  supplierId: string;
  updatedAt: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
}

export interface Movement {
  id: string;
  productId: string;
  productName?: string;
  type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  userId: string;
  userName?: string;
  date: string;
  reason: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'employee';
  photoURL: string;
}

export interface Customer {
  id: string;
  documentType: 'DNI' | 'RUC';
  documentNumber: string;
  name: string;
  address?: string;
  email?: string;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceType = 'boleta' | 'factura' | 'guia';

export interface Invoice {
  id: string;
  type: 'boleta' | 'factura' | 'guia';
  series: string;
  number: number;
  date: string;
  customerId?: string;
  customerName: string;
  customerDocument: string;
  items: InvoiceItem[];
  subtotal: number;
  igv: number;
  total: number;
  userId: string;
  status: 'accepted' | 'rejected' | 'pending';
  xmlUrl?: string;
  pdfUrl?: string;
  cdrUrl?: string;
}

export interface BusinessSettings {
  ruc: string;
  razonSocial: string;
  direccion: string;
  boletaSeries: string;
  facturaSeries: string;
  guiaSeries: string;
  nextBoletaNumber: number;
  nextFacturaNumber: number;
  nextGuiaNumber: number;
}
