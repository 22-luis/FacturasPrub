
import type { ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';

export type UserRole = 'repartidor' | 'supervisor' | 'administrador' | 'bodega';

export type InvoiceStatus = 'PENDIENTE' | 'ENTREGADA' | 'CANCELADA' | 'EN_PREPARACION' | 'LISTO_PARA_RUTA' | 'INCIDENCIA_BODEGA';

export type RouteStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password?: string; 
  createdAt?: Date | string; 
  updatedAt?: Date | string; 
}

export interface Branch {
  id: string;
  name: string; 
  contactPhone?: string;
  address: string;
  clientId: string; 
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Client {
  id: string;
  name: string; 
  phone?: string; 
  mainAddress?: string; 
  branches?: Branch[]; 
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type ClientFormData = Omit<Client, 'id' | 'branches' | 'createdAt' | 'updatedAt'>;

export interface AssignedInvoice {
  id:string;
  invoiceNumber: string;
  date: string; // Keep as string for form input, convert to Date for Prisma
  totalAmount: number;
  supplierName: string;
  uniqueCode: string;
  address?: string;
  assigneeId?: string | null; 
  status: InvoiceStatus;
  cancellationReason?: string;
  assignee?: { 
    id: string;
    name: string;
  } | null;
  clientId?: string | null; 
  client?: Client | null; 
  routeId?: string | null; // To associate invoice with a route for bodega view
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type InvoiceFormData = Omit<AssignedInvoice, 'id' | 'assignee' | 'client' | 'routeId' | 'createdAt' | 'updatedAt'> & {
  clientId?: string | null; 
};

export interface Route {
  id: string;
  date: string; // Store as ISO string or YYYY-MM-DD for simplicity in mock/state
  repartidorId: string;
  repartidorName?: string; // For display convenience
  invoiceIds: string[];
  invoices?: AssignedInvoice[]; // For display convenience, populated from invoiceIds
  status: RouteStatus;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type RouteFormData = {
  date: string;
  repartidorId: string;
  invoiceIds: string[];
  status?: RouteStatus; // Optional on creation, defaults to PLANNED
};


export type ExtractedInvoiceDetails = ExtractInvoiceDataOutput;

export interface VerificationField {
  assigned: string | number;
  extracted: string | number | undefined;
  match: boolean;
  label: string;
}

export interface VerificationResult {
  overallMatch: boolean;
  fields: VerificationField[];
}

export type ApiRouteContext<P extends Record<string, string | string[]> = Record<string, string | string[]>> = {
  params: P;
};
