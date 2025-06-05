
import type { ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';

export type UserRole = 'repartidor' | 'supervisor' | 'administrador'; // Added 'administrador'

export type InvoiceStatus = 'PENDIENTE' | 'ENTREGADA' | 'CANCELADA';

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
  address?: string;
  assigneeId?: string;
  status: InvoiceStatus;
  cancellationReason?: string;
}

export type InvoiceFormData = Omit<AssignedInvoice, 'id'>;


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
  { id: 'user-adm-1', name: 'Admin User', role: 'administrador' },
  { id: 'user-sup-1', name: 'Ana Supervisora', role: 'supervisor' },
  { id: 'user-rep-1', name: 'Juan Repartidor', role: 'repartidor' },
  { id: 'user-rep-2', name: 'Luisa Repartidora', role: 'repartidor' },
  { id: 'user-rep-3', name: 'Carlos Vendedor', role: 'repartidor' },
  { id: 'user-sup-2', name: 'Sofia Encargada', role: 'supervisor' },
  { id: 'user-rep-4', name: 'Pedro Entregas', role: 'repartidor' },
  { id: 'user-rep-5', name: 'Maria Logistica', role: 'repartidor' },
  { id: 'user-adm-2', name: 'Laura Admin', role: 'administrador' },
  { id: 'user-rep-6', name: 'Ricardo Movil', role: 'repartidor' },
  { id: 'user-rep-7', name: 'Elena Despacho', role: 'repartidor' },
  { id: 'user-sup-3', name: 'Miguel Coordinador', role: 'supervisor' },
];

export const mockInvoices: AssignedInvoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    date: '2024-07-15',
    totalAmount: 150.75,
    supplierName: 'Office Supplies Inc.',
    uniqueCode: 'XYZ123',
    address: '123 Main St, Anytown, CA 90210',
    assigneeId: 'user-rep-1',
    status: 'PENDIENTE',
  },
  {
    id: '2',
    invoiceNumber: 'A-5678',
    date: '2024-07-20',
    totalAmount: 89.99,
    supplierName: 'Tech Solutions Ltd.',
    uniqueCode: 'QWE456',
    address: '456 Oak Ave, Sometown, TX 75001',
    assigneeId: 'user-rep-2',
    status: 'ENTREGADA',
  },
  {
    id: '3',
    invoiceNumber: 'INV00123',
    date: '2023-01-15',
    totalAmount: 120.50,
    supplierName: 'Supplier A',
    uniqueCode: 'SUPA123',
    address: '789 Pine Rd, Villagetown, FL 33101',
    status: 'PENDIENTE',
  },
  {
    id: '4',
    invoiceNumber: 'B-9101',
    date: '2024-07-22',
    totalAmount: 250.00,
    supplierName: 'Marketing Co.',
    uniqueCode: 'MKT789',
    address: '101 Business Dr, Corp City, NY 10001',
    assigneeId: 'user-rep-1',
    status: 'CANCELADA',
    cancellationReason: 'Cliente solicitó cancelar el pedido.',
  },
  {
    id: '5',
    invoiceNumber: 'INV-XYZ-005',
    date: '2024-06-10',
    totalAmount: 55.00,
    supplierName: 'Cafe Central',
    uniqueCode: 'CAFE001',
    assigneeId: undefined,
    status: 'PENDIENTE',
  }
];

export const generateInvoiceId = () => `inv_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`;

export const generateUserId = () => `user_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7)}`;
