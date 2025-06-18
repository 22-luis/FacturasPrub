
'use client';

import type { User, AssignedInvoice, UserRole, InvoiceStatus, Client, Branch, Route, RouteStatus } from './types';
import bcrypt from 'bcryptjs';
import { formatISO, parseISO, startOfDay } from 'date-fns';

const saltRounds = 10;
const hashedAdminPassword = bcrypt.hashSync('123', saltRounds);
const hashedSupPassword = bcrypt.hashSync('123', saltRounds);
const hashedJohnPassword = bcrypt.hashSync('123', saltRounds);
const hashedJanePassword = bcrypt.hashSync('123', saltRounds);


export const mockUsers: User[] = [
  {
    id: 'admin-001',
    name: 'admin',
    role: 'administrador' as UserRole,
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

export const mockClients: Client[] = [
  {
    id: 'client-001',
    name: 'Constructora Omega',
    phone: '555-1234',
    mainAddress: 'Av. Siempre Viva 742, Springfield',
    branches: [
      { 
        id: 'branch-001-a', 
        clientId: 'client-001', 
        name: 'Almacén Central', 
        address: 'Calle Falsa 123, Springfield Este', 
        contactPhone: '555-1235',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { 
        id: 'branch-001-b', 
        clientId: 'client-001', 
        name: 'Oficina Norte', 
        address: 'Blvd. Principal 900, Springfield Norte', 
        contactPhone: '555-1236',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date('2023-02-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2023-02-01T10:00:00Z').toISOString(),
  },
  {
    id: 'client-002',
    name: 'Decoraciones Acme',
    phone: '555-5678',
    mainAddress: 'Ruta 66, Local 10, Ciudad Gótica',
    createdAt: new Date('2023-03-15T14:30:00Z').toISOString(),
    updatedAt: new Date('2023-03-15T14:30:00Z').toISOString(),
  },
  {
    id: 'client-003',
    name: 'Servicios Industriales Zeta',
    phone: '555-9012',
    mainAddress: 'Parque Industrial Bloque Z, Metrópolis',
    branches: [
       { 
        id: 'branch-003-a', 
        clientId: 'client-003', 
        name: 'Planta Principal', 
        address: 'Zona Industrial Lote 5, Metrópolis', 
        contactPhone: '555-9013',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date('2023-04-10T09:00:00Z').toISOString(),
    updatedAt: new Date('2023-04-10T09:00:00Z').toISOString(),
  }
];

// Dates for invoices should be YYYY-MM-DD strings for form compatibility
export const mockInvoices: AssignedInvoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'FAC-2024-001',
    date: formatISO(new Date(2024, 6, 15), { representation: 'date' }), // July 15, 2024
    totalAmount: 150.75,
    supplierName: 'Proveedor Alpha',
    uniqueCode: 'CODEALPHA001',
    address: 'Calle Principal 123, Ciudad Ejemplo',
    assigneeId: 'john-003', 
    clientId: 'client-001', 
    status: 'PENDIENTE' as InvoiceStatus,
    createdAt: new Date('2024-07-15T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-15T09:00:00Z').toISOString(),
  },
  {
    id: 'inv-002',
    invoiceNumber: 'FAC-2024-002',
    date: formatISO(new Date(2024, 6, 16), { representation: 'date' }), // July 16, 2024
    totalAmount: 200.00,
    supplierName: 'Suministros Beta',
    uniqueCode: 'CODEBETA002',
    address: 'Avenida Central 456, Villa Test',
    assigneeId: 'john-003', 
    clientId: 'client-002', 
    status: 'ENTREGADA' as InvoiceStatus,
    createdAt: new Date('2024-07-16T10:30:00Z').toISOString(),
    updatedAt: new Date('2024-07-18T14:00:00Z').toISOString(),
  },
  {
    id: 'inv-003',
    invoiceNumber: 'FAC-2024-003',
    date: formatISO(new Date(2024, 6, 17), { representation: 'date' }), // July 17, 2024
    totalAmount: 75.50,
    supplierName: 'Servicios Gamma',
    uniqueCode: 'CODEGAMMA003',
    address: 'Plaza Mayor 789, Pueblo Prueba',
    assigneeId: 'john-003', 
    status: 'CANCELADA' as InvoiceStatus,
    cancellationReason: 'Cliente ausente tras múltiples intentos.',
    createdAt: new Date('2024-07-17T11:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-19T10:00:00Z').toISOString(),
  },
  {
    id: 'inv-004',
    invoiceNumber: 'FAC-2024-004',
    date: formatISO(new Date(2024, 6, 18), { representation: 'date' }), // July 18, 2024
    totalAmount: 350.20,
    supplierName: 'Importaciones Delta',
    uniqueCode: 'CODEDELTA004',
    address: 'Camino Largo 101, Distrito Demo',
    assigneeId: null, 
    clientId: 'client-001', 
    status: 'PENDIENTE' as InvoiceStatus,
    createdAt: new Date('2024-07-18T14:15:00Z').toISOString(),
    updatedAt: new Date('2024-07-18T14:15:00Z').toISOString(),
  },
  {
    id: 'inv-005',
    invoiceNumber: 'FAC-2024-005',
    date: formatISO(new Date(2024, 6, 19), { representation: 'date' }), // July 19, 2024
    totalAmount: 99.99,
    supplierName: 'Tecnología Epsilon',
    uniqueCode: 'CODEEPSILON005',
    address: 'Ruta Corta 202, Comarca Mock',
    assigneeId: 'jane-004', 
    status: 'PENDIENTE' as InvoiceStatus,
    createdAt: new Date('2024-07-19T16:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-19T16:00:00Z').toISOString(),
  },
  {
    id: 'inv-006',
    invoiceNumber: 'FAC-2024-006',
    date: formatISO(new Date(2024, 6, 20), { representation: 'date' }), // July 20, 2024
    totalAmount: 120.00,
    supplierName: 'Proveedor Alpha', 
    uniqueCode: 'CODEALPHA006',
    address: 'Calle Secundaria 321, Ciudad Ejemplo',
    assigneeId: null, 
    clientId: 'client-003', 
    status: 'ENTREGADA' as InvoiceStatus,
    createdAt: new Date('2024-07-20T08:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-21T11:00:00Z').toISOString(),
  },
   {
    id: 'inv-007',
    invoiceNumber: 'FAC-2024-007',
    date: formatISO(new Date(2024, 6, 21), { representation: 'date' }), // July 21, 2024
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
    date: formatISO(new Date(2024, 6, 22), { representation: 'date' }), // July 22, 2024
    totalAmount: 275.00,
    supplierName: 'Importaciones Delta',
    uniqueCode: 'CODEDELTA008',
    address: 'Camino Demo 111, Distrito Demo',
    assigneeId: 'jane-004',
    clientId: 'client-002', 
    status: 'ENTREGADA' as InvoiceStatus,
    createdAt: new Date('2024-07-22T09:30:00Z').toISOString(),
    updatedAt: new Date('2024-07-22T16:30:00Z').toISOString(),
  },
  { // An invoice for "today" for easier testing of route creation for today
    id: 'inv-today-01',
    invoiceNumber: 'FAC-TODAY-001',
    date: formatISO(startOfDay(new Date()), { representation: 'date' }),
    totalAmount: 100.00,
    supplierName: 'Proveedor HoyMismo',
    uniqueCode: 'CODETODAY001',
    address: 'Plaza del Día, Ciudad Actual',
    assigneeId: null,
    clientId: 'client-001',
    status: 'PENDIENTE' as InvoiceStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-today-02',
    invoiceNumber: 'FAC-TODAY-002',
    date: formatISO(startOfDay(new Date()), { representation: 'date' }),
    totalAmount: 250.50,
    supplierName: 'Suministros Urgentes',
    uniqueCode: 'CODETODAY002',
    address: 'Calle de la Prisa 42, Pueblo Rápido',
    assigneeId: null,
    clientId: 'client-003',
    status: 'PENDIENTE' as InvoiceStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockRoutes: Route[] = [
  {
    id: 'route-001',
    date: formatISO(new Date(2024, 6, 22), { representation: 'date' }), // July 22, 2024
    repartidorId: 'jane-004',
    invoiceIds: ['inv-008'], // Jane delivered inv-008 on this day
    status: 'COMPLETED' as RouteStatus,
    createdAt: new Date('2024-07-22T08:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-22T17:00:00Z').toISOString(),
  },
  {
    id: 'route-002',
    date: formatISO(startOfDay(new Date()), { representation: 'date' }), // Today
    repartidorId: 'john-003',
    invoiceIds: ['inv-today-01'], // John is planned to deliver inv-today-01 today
    status: 'PLANNED' as RouteStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
