import type { ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';

export interface AssignedInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  supplierName: string;
  uniqueCode: string;
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

export const mockAssignedInvoices: AssignedInvoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    date: '2024-07-15',
    totalAmount: 150.75,
    supplierName: 'Office Supplies Inc.',
    uniqueCode: 'XYZ123',
  },
  {
    id: '2',
    invoiceNumber: 'A-5678',
    date: '2024-07-20',
    totalAmount: 89.99,
    supplierName: 'Tech Solutions Ltd.',
    uniqueCode: 'QWE456',
  },
  {
    id: '3',
    invoiceNumber: 'INV00123',
    date: '2023-01-15',
    totalAmount: 120.50,
    supplierName: 'Supplier A',
    uniqueCode: 'SUPA123',
  }
];
