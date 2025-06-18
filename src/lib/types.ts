
import type { ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';

export type UserRole = 'repartidor' | 'supervisor' | 'administrador';

export type InvoiceStatus = 'PENDIENTE' | 'ENTREGADA' | 'CANCELADA';

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
  name: string; // e.g., "Sucursal Centro"
  contactPhone?: string;
  address: string;
  clientId: string; // Foreign key to Client
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Client {
  id: string;
  name: string; // Nombre del cliente o empresa
  phone?: string; // Teléfono de contacto principal
  mainAddress?: string; // Dirección principal
  branches?: Branch[]; // Array of associated branches
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AssignedInvoice {
  id:string;
  invoiceNumber: string;
  date: string; 
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
  clientId?: string | null; // Foreign key to Client
  client?: Client | null; // Optional: Embed client data if needed for display
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type InvoiceFormData = Omit<AssignedInvoice, 'id' | 'assignee' | 'client' | 'createdAt' | 'updatedAt'> & {
  clientId?: string | null; // Ensure clientId is part of form data
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
