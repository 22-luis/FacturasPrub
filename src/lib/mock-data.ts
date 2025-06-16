
'use client';

import type { User, AssignedInvoice, UserRole, InvoiceStatus } from './types';
import bcrypt from 'bcryptjs';

// Pre-hash passwords for mock users
const saltRounds = 10;
const hashedAdminPassword = bcrypt.hashSync('123', saltRounds);
const hashedSupPassword = bcrypt.hashSync('123', saltRounds);
const hashedJohnPassword = bcrypt.hashSync('123', saltRounds);
const hashedJanePassword = bcrypt.hashSync('123', saltRounds);


export const mockUsers: User[] = [
  {
    id: 'admin-001',
    name: 'admin',
    role: 'administrador' as UserRole, // Ensure role is UserRole
    password: hashedAdminPassword,
    createdAt: new Date('2023-01-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2023-01-01T10:00:00Z').toISOString(),
  },
  {
    id: 'sup-002',
    name: 'sup',
    role: 'supervisor' as UserRole,
    password: hashedSupPassword,
    createdAt: new Date('2023-01-02T11:00:00Z').toISOString(),
    updatedAt: new Date('2023-01-02T11:00:00Z').toISOString(),
  },
  {
    id: 'john-003',
    name: 'john',
    role: 'repartidor' as UserRole,
    password: hashedJohnPassword,
    createdAt: new Date('2023-01-03T12:00:00Z').toISOString(),
    updatedAt: new Date('2023-01-03T12:00:00Z').toISOString(),
  },
  {
    id: 'jane-004',
    name: 'jane',
    role: 'repartidor' as UserRole,
    password: hashedJanePassword,
    createdAt: new Date('2023-01-04T13:00:00Z').toISOString(),
    updatedAt: new Date('2023-01-04T13:00:00Z').toISOString(),
  },
];

export const mockInvoices: AssignedInvoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'FAC-2024-001',
    date: '2024-07-15',
    totalAmount: 150.75,
    supplierName: 'Proveedor Alpha',
    uniqueCode: 'CODEALPHA001',
    address: 'Calle Principal 123, Ciudad Ejemplo',
    assigneeId: 'john-003', // Assigned to John
    status: 'PENDIENTE' as InvoiceStatus,
    createdAt: new Date('2024-07-15T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-15T09:00:00Z').toISOString(),
  },
  {
    id: 'inv-002',
    invoiceNumber: 'FAC-2024-002',
    date: '2024-07-16',
    totalAmount: 200.00,
    supplierName: 'Suministros Beta',
    uniqueCode: 'CODEBETA002',
    address: 'Avenida Central 456, Villa Test',
    assigneeId: 'john-003', // Assigned to John
    status: 'ENTREGADA' as InvoiceStatus,
    createdAt: new Date('2024-07-16T10:30:00Z').toISOString(),
    updatedAt: new Date('2024-07-18T14:00:00Z').toISOString(),
  },
  {
    id: 'inv-003',
    invoiceNumber: 'FAC-2024-003',
    date: '2024-07-17',
    totalAmount: 75.50,
    supplierName: 'Servicios Gamma',
    uniqueCode: 'CODEGAMMA003',
    address: 'Plaza Mayor 789, Pueblo Prueba',
    assigneeId: 'john-003', // Assigned to John
    status: 'CANCELADA' as InvoiceStatus,
    cancellationReason: 'Cliente ausente tras múltiples intentos.',
    createdAt: new Date('2024-07-17T11:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-19T10:00:00Z').toISOString(),
  },
  {
    id: 'inv-004',
    invoiceNumber: 'FAC-2024-004',
    date: '2024-07-18',
    totalAmount: 350.20,
    supplierName: 'Importaciones Delta',
    uniqueCode: 'CODEDELTA004',
    address: 'Camino Largo 101, Distrito Demo',
    assigneeId: null, // Unassigned
    status: 'PENDIENTE' as InvoiceStatus,
    createdAt: new Date('2024-07-18T14:15:00Z').toISOString(),
    updatedAt: new Date('2024-07-18T14:15:00Z').toISOString(),
  },
  {
    id: 'inv-005',
    invoiceNumber: 'FAC-2024-005',
    date: '2024-07-19',
    totalAmount: 99.99,
    supplierName: 'Tecnología Epsilon',
    uniqueCode: 'CODEEPSILON005',
    address: 'Ruta Corta 202, Comarca Mock',
    assigneeId: 'jane-004', // Assigned to Jane
    status: 'PENDIENTE' as InvoiceStatus,
    createdAt: new Date('2024-07-19T16:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-19T16:00:00Z').toISOString(),
  },
  {
    id: 'inv-006',
    invoiceNumber: 'FAC-2024-006',
    date: '2024-07-20',
    totalAmount: 120.00,
    supplierName: 'Proveedor Alpha', // Repeated supplier for filtering tests
    uniqueCode: 'CODEALPHA006',
    address: 'Calle Secundaria 321, Ciudad Ejemplo',
    assigneeId: null, // Unassigned
    status: 'ENTREGADA' as InvoiceStatus,
    createdAt: new Date('2024-07-20T08:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-21T11:00:00Z').toISOString(),
  },
   {
    id: 'inv-007',
    invoiceNumber: 'FAC-2024-007',
    date: '2024-07-21',
    totalAmount: 50.00,
    supplierName: 'Suministros Beta',
    uniqueCode: 'CODEBETA007',
    address: 'Avenida Test 789, Villa Test',
    assigneeId: 'john-003',
    status: 'PENDIENTE' as InvoiceStatus,
    createdAt: new Date('2024-07-21T15:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-21T15:00:00Z').toISOString(),
  },
  {
    id: 'inv-008',
    invoiceNumber: 'FAC-2024-008',
    date: '2024-07-22',
    totalAmount: 275.00,
    supplierName: 'Importaciones Delta',
    uniqueCode: 'CODEDELTA008',
    address: 'Camino Demo 111, Distrito Demo',
    assigneeId: 'jane-004',
    status: 'ENTREGADA' as InvoiceStatus,
    createdAt: new Date('2024-07-22T09:30:00Z').toISOString(),
    updatedAt: new Date('2024-07-22T16:30:00Z').toISOString(),
  },
];
