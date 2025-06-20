'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/AppHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Search, FileText, Edit, Trash2, PackageSearch, PackageCheck, CheckCircle2, XCircle, AlertTriangle, ShieldX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AssignedInvoice, InvoiceStatus, InvoiceFormData, User, Client, Route } from '@/lib/types';
import { AddEditInvoiceDialog } from '@/components/AddEditInvoiceDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusConfig: Record<InvoiceStatus, { label: string; icon: React.ElementType; color: string }> = {
  PENDIENTE: { label: 'Pendiente', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
  EN_PREPARACION: { label: 'En Preparación', icon: PackageSearch, color: 'bg-blue-100 text-blue-800' },
  LISTO_PARA_RUTA: { label: 'Listo para Ruta', icon: PackageCheck, color: 'bg-green-100 text-green-800' },
  ENTREGADA: { label: 'Entregada', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-800' },
  CANCELADA: { label: 'Cancelada', icon: XCircle, color: 'bg-red-100 text-red-800' },
  INCIDENCIA_BODEGA: { label: 'Incidencia Bodega', icon: ShieldX, color: 'bg-orange-100 text-orange-800' },
};

export default function FacturasPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<AssignedInvoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<AssignedInvoice | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<AssignedInvoice | null>(null);

  useEffect(() => {
    fetchInvoices();
    fetchUsers();
    fetchClients();
    fetchRoutes();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/invoices');
      if (!response.ok) {
        throw new Error('Error al cargar facturas');
      }
      const data: AssignedInvoice[] = await response.json();
      setInvoices(data);
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      const data: User[] = await response.json();
      setUsers(data);
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Error al cargar clientes');
      }
      const data: Client[] = await response.json();
      setClients(data);
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/routes');
      if (!response.ok) {
        throw new Error('Error al cargar rutas');
      }
      const data: Route[] = await response.json();
      setRoutes(data);
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
  };

  const handleAddInvoice = () => {
    setInvoiceToEdit(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEditInvoice = (invoice: AssignedInvoice) => {
    setInvoiceToEdit(invoice);
    setIsAddEditDialogOpen(true);
  };

  const handleDeleteInvoice = (invoice: AssignedInvoice) => {
    setInvoiceToDelete(invoice);
    setIsConfirmDeleteOpen(true);
  };

  const handleSaveInvoice = async (invoiceData: InvoiceFormData, id?: string) => {
    try {
      const url = id ? `/api/invoices/${id}` : '/api/invoices';
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar factura');
      }

      toast({ 
        title: 'Éxito', 
        description: id ? 'Factura actualizada' : 'Factura creada' 
      });
      
      setIsAddEditDialogOpen(false);
      fetchInvoices();
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar factura');
      }

      toast({ 
        title: 'Éxito', 
        description: 'Factura eliminada' 
      });
      
      setIsConfirmDeleteOpen(false);
      fetchInvoices();
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.assignee?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
          <p>Debes iniciar sesión para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader loggedInUser={user} onLogout={logout} />
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <div className="container mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Facturas</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">Gestiona las facturas del sistema</p>
                </div>
                <Button onClick={handleAddInvoice} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Factura
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <CardTitle className="text-lg sm:text-xl">Lista de Facturas</CardTitle>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus | 'ALL')}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Filtrar por estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos los estados</SelectItem>
                          {Object.entries(statusConfig).map(([status, config]) => (
                            <SelectItem key={status} value={status}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar factura..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full sm:w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Cargando facturas...</p>
                    </div>
                  ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'ALL' ? 'No se encontraron facturas' : 'No hay facturas registradas'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:gap-4">
                      {filteredInvoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                        >
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm sm:text-base">
                                Factura #{invoice.invoiceNumber}
                              </h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                                <span>Cliente: {invoice.client?.name || 'N/A'}</span>
                                <span>Repartidor: {invoice.assignee?.name || 'Sin asignar'}</span>
                                {invoice.createdAt && (
                                  <span>
                                    Creada: {format(new Date(invoice.createdAt), 'dd/MM/yyyy', { locale: es })}
                                  </span>
                                )}
                                {invoice.totalAmount && (
                                  <span className="font-medium">
                                    ${invoice.totalAmount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-2">
                            <div className="flex-shrink-0">
                              {getStatusBadge(invoice.status)}
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditInvoice(invoice)}
                                className="h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline ml-1">Editar</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteInvoice(invoice)}
                                className="h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline ml-1">Eliminar</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>

      <AddEditInvoiceDialog
        isOpen={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        invoiceToEdit={invoiceToEdit}
        users={users}
        clients={clients}
        allRoutes={routes}
        onSave={handleSaveInvoice}
      />

      <ConfirmDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        title="Eliminar Factura"
        description={`¿Estás seguro de que quieres eliminar la factura #${invoiceToDelete?.invoiceNumber}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
      />
    </SidebarProvider>
  );
} 