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
import { PlusCircle, Search, Map, Edit, Trash2, Calendar, Truck, PackageCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Route, RouteFormData, RouteStatus, User, AssignedInvoice } from '@/lib/types';
import { AddEditRouteDialog } from '@/components/AddEditRouteDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusConfig: Record<RouteStatus, { label: string; color: string }> = {
  PLANNED: { label: 'Planificada', color: 'bg-yellow-100 text-yellow-800' },
  IN_PROGRESS: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
  COMPLETED: { label: 'Completada', color: 'bg-green-100 text-green-800' },
};

export default function RutasPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [repartidores, setRepartidores] = useState<User[]>([]);
  const [invoices, setInvoices] = useState<AssignedInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RouteStatus | 'ALL'>('ALL');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState<Route | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);

  useEffect(() => {
    fetchRoutes();
    fetchRepartidores();
    fetchInvoices();
  }, []);

  const fetchRoutes = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRepartidores = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Error al cargar repartidores');
      }
      const data: User[] = await response.json();
      // Filtrar solo repartidores
      const repartidoresData = data.filter(u => u.role === 'repartidor');
      setRepartidores(repartidoresData);
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
  };

  const fetchInvoices = async () => {
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
    }
  };

  const handleAddRoute = () => {
    setRouteToEdit(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEditRoute = (route: Route) => {
    setRouteToEdit(route);
    setIsAddEditDialogOpen(true);
  };

  const handleDeleteRoute = (route: Route) => {
    setRouteToDelete(route);
    setIsConfirmDeleteOpen(true);
  };

  const handleSaveRoute = async (routeData: RouteFormData, id?: string) => {
    try {
      const url = id ? `/api/routes/${id}` : '/api/routes';
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar ruta');
      }

      toast({ 
        title: 'Éxito', 
        description: id ? 'Ruta actualizada' : 'Ruta creada' 
      });
      
      setIsAddEditDialogOpen(false);
      fetchRoutes();
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!routeToDelete) return;

    try {
      const response = await fetch(`/api/routes/${routeToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar ruta');
      }

      toast({ 
        title: 'Éxito', 
        description: 'Ruta eliminada' 
      });
      
      setIsConfirmDeleteOpen(false);
      fetchRoutes();
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
  };

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = 
      route.repartidorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || route.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: RouteStatus) => {
    const config = statusConfig[status];
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
                  <h1 className="text-2xl sm:text-3xl font-bold">Gestionar Rutas</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">Gestiona las rutas de entrega del sistema</p>
                </div>
                <Button onClick={handleAddRoute} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Ruta
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <CardTitle className="text-lg sm:text-xl">Lista de Rutas</CardTitle>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RouteStatus | 'ALL')}>
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
                          placeholder="Buscar ruta..."
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
                      <p className="mt-2 text-muted-foreground">Cargando rutas...</p>
                    </div>
                  ) : filteredRoutes.length === 0 ? (
                    <div className="text-center py-8">
                      <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'ALL' ? 'No se encontraron rutas' : 'No hay rutas registradas'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:gap-4">
                      {filteredRoutes.map((route) => (
                        <div
                          key={route.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                        >
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Map className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm sm:text-base">
                                Ruta #{route.id.slice(-8)}
                              </h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                  <Truck className="h-3 w-3" />
                                  <span>Repartidor: {route.repartidorName || 'Sin asignar'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Fecha: {format(new Date(route.date), 'dd/MM/yyyy', { locale: es })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <PackageCheck className="h-3 w-3" />
                                  <span>Facturas: {route.invoiceIds?.length || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-2">
                            <div className="flex-shrink-0">
                              {getStatusBadge(route.status)}
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRoute(route)}
                                className="h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline ml-1">Editar</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRoute(route)}
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

      <AddEditRouteDialog
        isOpen={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        routeToEdit={routeToEdit}
        repartidores={repartidores}
        allInvoices={invoices}
        onSave={handleSaveRoute}
      />

      <ConfirmDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        title="Eliminar Ruta"
        description={`¿Estás seguro de que quieres eliminar la ruta #${routeToDelete?.id.slice(-8)}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
      />
    </SidebarProvider>
  );
} 