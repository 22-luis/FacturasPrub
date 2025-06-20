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
import { Search, FileEdit, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AssignedInvoice } from '@/lib/types';

export default function RefacturacionPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<AssignedInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/invoices');
      if (!response.ok) {
        throw new Error('Error al cargar facturas');
      }
      const data: AssignedInvoice[] = await response.json();
      // Filtrar facturas que podrían necesitar refacturación (canceladas, con incidencias, etc.)
      const refacturacionInvoices = data.filter(invoice => 
        invoice.status === 'CANCELADA' || 
        invoice.status === 'INCIDENCIA_BODEGA' ||
        invoice.incidenceType === 'REFACTURACION'
      );
      setInvoices(refacturacionInvoices);
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

  const handleRefacturar = async (invoiceId: string) => {
    try {
      // Aquí iría la lógica para procesar la refacturación
      toast({ 
        title: 'Procesando', 
        description: 'Refacturación en proceso...' 
      });
      
      // Simular proceso de refacturación
      setTimeout(() => {
        toast({ 
          title: 'Éxito', 
          description: 'Refacturación completada' 
        });
        fetchInvoices(); // Recargar datos
      }, 2000);
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
      INCIDENCIA_BODEGA: { label: 'Incidencia Bodega', color: 'bg-orange-100 text-orange-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    
    return (
      <Badge className={config.color}>
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
                  <h1 className="text-2xl sm:text-3xl font-bold">Refacturación</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">Gestiona las refacturaciones de facturas</p>
                </div>
                <Button onClick={fetchInvoices} variant="outline" className="w-full sm:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualizar
                </Button>
              </div>

              <div className="grid gap-4 sm:gap-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Refacturaciones</CardTitle>
                      <FileEdit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl sm:text-2xl font-bold">{invoices.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Facturas pendientes de refacturación
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl sm:text-2xl font-bold">
                        {invoices.filter(inv => inv.status === 'CANCELADA').length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Facturas canceladas
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="sm:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl sm:text-2xl font-bold">
                        {invoices.filter(inv => inv.status === 'INCIDENCIA_BODEGA').length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Con incidencias de bodega
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-lg sm:text-xl">Facturas para Refacturación</CardTitle>
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
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Cargando facturas...</p>
                    </div>
                  ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-8">
                      <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No se encontraron facturas' : 'No hay facturas pendientes de refacturación'}
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
                              <FileEdit className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm sm:text-base">
                                Factura #{invoice.invoiceNumber}
                              </h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                                <span>Cliente: {invoice.client?.name || 'N/A'}</span>
                                <span>Repartidor: {invoice.assignee?.name || 'Sin asignar'}</span>
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
                            <Button
                              onClick={() => handleRefacturar(invoice.id)}
                              size="sm"
                              className="h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                            >
                              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline ml-1">Refacturar</span>
                            </Button>
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
    </SidebarProvider>
  );
} 