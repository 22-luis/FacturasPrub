
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
  clientId?: string | null; 
  client?: Client | null; 
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type InvoiceFormData = Omit<AssignedInvoice, 'id' | 'assignee' | 'client' | 'createdAt' | 'updatedAt'> & {
  clientId?: string | null; 
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

