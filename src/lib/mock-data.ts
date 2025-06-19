
'use client';

import type { User, AssignedInvoice, UserRole, InvoiceStatus, Client, Branch, Route, RouteStatus } from './types';
import bcrypt from 'bcryptjs';
import { formatISO, startOfDay } from 'date-fns';

const saltRounds = 10;
const hashedAdminPassword = bcrypt.hashSync('123', saltRounds);
const hashedSupPassword = bcrypt.hashSync('123', saltRounds);
const hashedJohnPassword = bcrypt.hashSync('123', saltRounds);
const hashedJanePassword = bcrypt.hashSync('123', saltRounds);
const hashedBodegaPassword = bcrypt.hashSync('123', saltRounds);


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
  {
    id: 'bodega-005',
    name: 'bodeguero',
    role: 'bodega' as UserRole,
    password: hashedBodegaPassword,
    createdAt: new Date('2023-01-05T14:00:00Z').toISOString(),
    updatedAt: new Date('2023-01-05T14:00:00Z').toISOString(),
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
export let mockInvoices: AssignedInvoice[] = [ // Changed to let for routeId modification
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
    routeId: null,
    incidenceType: null,
    incidenceDetails: undefined,
    incidenceReportedAt: null,
    incidenceRequiresAction: false,
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
    routeId: null,
    incidenceType: null,
    incidenceDetails: undefined,
    incidenceReportedAt: null,
    incidenceRequiresAction: false,
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
    routeId: null,
    incidenceType: null,
    incidenceDetails: undefined,
    incidenceReportedAt: null,
    incidenceRequiresAction: false,
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
    routeId: null,
    incidenceType: null,
    incidenceDetails: undefined,
    incidenceReportedAt: null,
    incidenceRequiresAction: false,
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
    routeId: null,
    incidenceType: null,
    incidenceDetails: undefined,
    incidenceReportedAt: null,
    incidenceRequiresAction: false,
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
    routeId: null,
    incidenceType: null,
    incidenceDetails: undefined,
    incidenceReportedAt: null,
    incidenceRequiresAction: false,
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
    routeId: null,
    incidenceType: null,
    incidenceDetails: undefined,
    incidenceReportedAt: null,
    incidenceRequiresAction: false,
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
    status: 'LISTO_PARA_RUTA' as InvoiceStatus, // Changed for bodega testing
    createdAt: new Date('2024-07-22T09:30:00Z').toISOString(),
    updatedAt: new Date('2024-07-22T16:30:00Z').toISOString(),
    routeId: 'route-001', // Assign to route-001
    incidenceType: null,
    incidenceDetails: undefined,
    incidenceReportedAt: null,
    incidenceRequiresAction: false,
  },
  { 
    id: 'inv-today-01',
    invoiceNumber: 'FAC-TODAY-001',
    date: formatISO(startOfDay(new Date()), { representation: 'date' }),
    totalAmount: 100.00,
    supplierName: 'Proveedor HoyMismo',
    uniqueCode: 'CODETODAY001',
    address: 'Plaza del Día, Ciudad Actual',
    assigneeId: 'john-003', // Assign to John for route
    clientId: 'client-001',
    status: 'PENDIENTE' as InvoiceStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    routeId: 'route-002', // Assign to route-002
    incidenceType: null,
    incidenceDetails: undefined,
    incidenceReportedAt: null,
    incidenceRequiresAction: false,
  },
  {
    id: 'inv-today-02',
    invoiceNumber: 'FAC-TODAY-002',
    date: formatISO(startOfDay(new Date()), { representation: 'date' }),
    totalAmount: 250.50,
    supplierName: 'Suministros Urgentes',
    uniqueCode: 'CODETODAY002',
    address: 'Calle de la Prisa 42, Pueblo Rápido',
    assigneeId: null, // Keep unassigned for now, or assign to another route
    clientId: 'client-003',
    status: 'PENDIENTE' as InvoiceStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    routeId: null,
    incidenceType: null,
    incidenceDetails: undefined,
    incidenceReportedAt: null,
    incidenceRequiresAction: false,
  },
  {
    id: 'inv-bodega-prep',
    invoiceNumber: 'FAC-BODEGA-PREP-001',
    date: formatISO(startOfDay(new Date()), { representation: 'date' }),
    totalAmount: 75.00,
    supplierName: 'Materiales Bodega',
    uniqueCode: 'CODEBODPREP001',
    address: 'Almacén Central, Zona Industrial',
    assigneeId: 'jane-004', // Assign to Jane for route
    clientId: 'client-001',
    status: 'EN_PREPARACION' as InvoiceStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    routeId: 'route-bodega-jane', // Needs a corresponding route
    incidenceType: null,
    incidenceDetails: undefined,
    incidenceReportedAt: null,
    incidenceRequiresAction: false,
  },
];

export const mockRoutes: Route[] = [
  {
    id: 'route-001',
    date: formatISO(new Date(2024, 6, 22), { representation: 'date' }), // July 22, 2024
    repartidorId: 'jane-004',
    invoiceIds: ['inv-008'], 
    status: 'COMPLETED' as RouteStatus,
    createdAt: new Date('2024-07-22T08:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-22T17:00:00Z').toISOString(),
  },
  {
    id: 'route-002',
    date: formatISO(startOfDay(new Date()), { representation: 'date' }), // Today
    repartidorId: 'john-003',
    invoiceIds: ['inv-today-01'], 
    status: 'PLANNED' as RouteStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'route-bodega-jane',
    date: formatISO(startOfDay(new Date()), { representation: 'date' }), // Today
    repartidorId: 'jane-004',
    invoiceIds: ['inv-bodega-prep'],
    status: 'PLANNED' as RouteStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Assign routeId to invoices based on mockRoutes
mockRoutes.forEach(route => {
  route.invoiceIds.forEach(invoiceId => {
    const invoiceIndex = mockInvoices.findIndex(inv => inv.id === invoiceId);
    if (invoiceIndex !== -1) {
      mockInvoices[invoiceIndex].routeId = route.id;
      // Also ensure the invoice's assigneeId matches the route's repartidorId
      // if the invoice is meant to be on that repartidor's route.
      // This is important for Repartidor's view.
      // For Bodega view, they see based on routeId and route.status
      if (mockInvoices[invoiceIndex].assigneeId !== route.repartidorId) {
        // console.warn(`Invoice ${invoiceId} assigned to route ${route.id} for repartidor ${route.repartidorId}, but invoice assignee is ${mockInvoices[invoiceIndex].assigneeId}. Consider aligning them.`);
        // For simplicity, we might assume invoices on a route are implicitly for that route's repartidor if assigneeId is null or matches.
        // Or, the supervisor explicitly assigns invoices to repartidores, and then to routes.
        // For now, `routeId` on invoice helps Bodega.
      }
    }
  });
});

