
import type { ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';

export type UserRole = 'repartidor' | 'supervisor' | 'administrador';

export type InvoiceStatus = 'PENDIENTE' | 'ENTREGADA' | 'CANCELADA';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password?: string; // Password is mainly for creation/login, not stored in frontend state after login
  createdAt?: Date | string; // Optional, from DB
  updatedAt?: Date | string; // Optional, from DB
}

export interface AssignedInvoice {
  id:string;
  invoiceNumber: string;
  date: string; // Keep as string for simplicity, API handles Date conversion
  totalAmount: number;
  supplierName: string;
  uniqueCode: string;
  address?: string;
  assigneeId?: string | null; // Allow null for unassigned
  status: InvoiceStatus;
  cancellationReason?: string;
  assignee?: { // For displaying assignee name from included relation
    id: string;
    name: string;
  } | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type InvoiceFormData = Omit<AssignedInvoice, 'id' | 'assignee' | 'createdAt' | 'updatedAt'>;


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

// Mock data and generators are removed as the app will now use the API and database.

/**
 * Defines the shape of the context object passed as the second argument to API route handlers.
 * The `params` property contains the dynamic route parameters.
 * @template P - An object type where keys are parameter names and values are strings or string arrays.
 */
export type ApiRouteContext<P extends Record<string, string | string[]> = Record<string, string | string[]>> = {
  params: P;
};
