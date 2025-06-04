
import type { ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';

export type UserRole = 'repartidor' | 'supervisor';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface AssignedInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  supplierName: string;
  uniqueCode: string;
  assigneeId?: string; // ID of the User (repartidor) it is assigned to
}

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

export const mockUsers: User[] = [
  { id: 'user-sup-1', name: 'Ana Supervisora', role: 'supervisor' },
  { id: 'user-rep-1', name: 'Juan Repartidor', role: 'repartidor' },
  { id: 'user-rep-2', name: 'Luisa Repartidora', role: 'repartidor' },
];

export const mockInvoices: AssignedInvoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    date: '2024-07-15',
    totalAmount: 150.75,
    supplierName: 'Office Supplies Inc.',
    uniqueCode: 'XYZ123',
    assigneeId: 'user-rep-1',
  },
  {
    id: '2',
    invoiceNumber: 'A-5678',
    date: '2024-07-20',
    totalAmount: 89.99,
    supplierName: 'Tech Solutions Ltd.',
    uniqueCode: 'QWE456',
    assigneeId: 'user-rep-2',
  },
  {
    id: '3',
    invoiceNumber: 'INV00123',
    date: '2023-01-15',
    totalAmount: 120.50,
    supplierName: 'Supplier A',
    uniqueCode: 'SUPA123',
  }, // Unassigned
  {
    id: '4',
    invoiceNumber: 'B-9101',
    date: '2024-07-22',
    totalAmount: 250.00,
    supplierName: 'Marketing Co.',
    uniqueCode: 'MKT789',
    assigneeId: 'user-rep-1',
  },
  {
    id: '5',
    invoiceNumber: 'INV-XYZ-005',
    date: '2024-06-10',
    totalAmount: 55.00,
    supplierName: 'Cafe Central',
    uniqueCode: 'CAFE001',
  } // Unassigned
];
