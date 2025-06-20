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
import { Label } from '@/components/ui/label';
import { PlusCircle, Search, UserPlus, Edit, Trash2, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, UserRole } from '@/lib/types';
import { AddEditUserDialog } from '@/components/AddEditUserDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function RepartidoresPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [repartidores, setRepartidores] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    fetchRepartidores();
  }, []);

  const fetchRepartidores = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRepartidor = () => {
    setUserToEdit(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEditRepartidor = (repartidor: User) => {
    setUserToEdit(repartidor);
    setIsAddEditDialogOpen(true);
  };

  const handleDeleteRepartidor = (repartidor: User) => {
    setUserToDelete(repartidor);
    setIsConfirmDeleteOpen(true);
  };

  const handleSaveRepartidor = async (userData: { name: string; role: UserRole; password?: string }, idToEdit?: string) => {
    try {
      const url = idToEdit ? `/api/users/${idToEdit}` : '/api/users';
      const method = idToEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, role: 'repartidor' }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar repartidor');
      }

      toast({ 
        title: 'Éxito', 
        description: idToEdit ? 'Repartidor actualizado' : 'Repartidor creado' 
      });
      
      setIsAddEditDialogOpen(false);
      fetchRepartidores();
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar repartidor');
      }

      toast({ 
        title: 'Éxito', 
        description: 'Repartidor eliminado' 
      });
      
      setIsConfirmDeleteOpen(false);
      fetchRepartidores();
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
  };

  const filteredRepartidores = repartidores.filter(repartidor =>
    repartidor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <h1 className="text-2xl sm:text-3xl font-bold">Repartidores</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">Gestiona los repartidores del sistema</p>
                </div>
                <Button onClick={handleAddRepartidor} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Repartidor
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-lg sm:text-xl">Lista de Repartidores</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar repartidor..."
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
                      <p className="mt-2 text-muted-foreground">Cargando repartidores...</p>
                    </div>
                  ) : filteredRepartidores.length === 0 ? (
                    <div className="text-center py-8">
                      <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No se encontraron repartidores' : 'No hay repartidores registrados'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:gap-4">
                      {filteredRepartidores.map((repartidor) => (
                        <div
                          key={repartidor.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                        >
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm sm:text-base">
                                {repartidor.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  Repartidor
                                </Badge>
                                {repartidor.createdAt && (
                                  <span className="text-xs text-muted-foreground">
                                    Registrado: {new Date(repartidor.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRepartidor(repartidor)}
                              className="h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline ml-1">Editar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRepartidor(repartidor)}
                              className="h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline ml-1">Eliminar</span>
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

      <AddEditUserDialog
        isOpen={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        userToEdit={userToEdit}
        availableRoles={['repartidor']}
        onSave={handleSaveRepartidor}
      />

      <ConfirmDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
        title="Eliminar Repartidor"
        description={`¿Estás seguro de que quieres eliminar al repartidor ${userToDelete?.name}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
      />
    </SidebarProvider>
  );
} 