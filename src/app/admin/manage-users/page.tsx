
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AddEditUserDialog } from '@/components/AddEditUserDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { mockUsers, generateUserId } from '@/lib/types'; // Using mocks directly
import type { User, UserRole } from '@/lib/types';
import { Toaster } from "@/components/ui/toaster";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users2 as UsersIconLucide, Pencil, Trash2, ShieldAlert, ShieldCheck, UserSquare2 as RepartidorIcon, User as UserIconLucide, Filter, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const adminRoleDisplayInfo: Record<User['role'], { Icon: React.ElementType; label: string, badgeClass?: string }> = {
  administrador: { Icon: ShieldAlert, label: 'Administrador', badgeClass: 'bg-purple-600 text-white hover:bg-purple-700' },
  supervisor: { Icon: ShieldCheck, label: 'Supervisor', badgeClass: 'bg-blue-500 text-white hover:bg-blue-600' },
  repartidor: { Icon: RepartidorIcon, label: 'Repartidor', badgeClass: 'bg-green-500 text-white hover:bg-green-600' },
};
const adminAvailableRolesForFilter: UserRole[] = ['administrador', 'supervisor', 'repartidor'];
const manageableUserRoles: UserRole[] = ['supervisor', 'repartidor']; // Roles an admin can assign/change to

export default function ManageUsersPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Simulate loggedInUser for this page. In a real app, this would come from a global auth context.
  // For this prototype, we'll assume if you reach this page, you are the 'admin' user.
  const [loggedInUser] = useState<User | null>(mockUsers.find(u => u.name === 'admin' && u.role === 'administrador') || null);
  
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isAddEditUserDialogOpen, setIsAddEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isConfirmDeleteUserOpen, setIsConfirmDeleteUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [adminUserListRoleFilter, setAdminUserListRoleFilter] = useState<UserRole | 'all'>('all');

  useEffect(() => {
    // Basic route protection for prototype
    if (!loggedInUser || loggedInUser.role !== 'administrador') {
      toast({ variant: "destructive", title: "Acceso Denegado", description: "No tienes permiso para ver esta página." });
      router.push('/');
    }
  }, [loggedInUser, router, toast]);

  const handleSimulatedLogout = () => {
    // This is a simulated logout for the prototype as state is not shared with HomePage
    toast({ title: "Sesión Cerrada (Simulada)", description: "Has cerrado sesión en la página de gestión." });
    router.push('/');
  };


  const handleOpenAddUserDialog = () => {
    setUserToEdit(null);
    setIsAddEditUserDialogOpen(true);
  };

  const handleOpenEditUserDialog = (user: User) => {
    setUserToEdit(user);
    setIsAddEditUserDialogOpen(true);
  };
  
  const handleSaveUser = (userData: { name: string; role: UserRole }, idToEdit?: string) => {
    if (idToEdit) {
        if (loggedInUser?.id === idToEdit && loggedInUser.role === 'administrador' && userData.role !== 'administrador') {
            toast({ variant: "destructive", title: "Operación no permitida", description: "Un administrador no puede cambiar su propio rol." });
            setIsAddEditUserDialogOpen(false);
            return;
        }
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === idToEdit ? { ...user, name: userData.name, role: userData.role } : user
        )
      );
      toast({ title: 'Usuario Actualizado', description: `Los datos de ${userData.name} han sido actualizados.` });
    } else { 
      const newUser: User = {
        id: generateUserId(),
        name: userData.name,
        role: userData.role,
      };
      setUsers(prevUsers => [...prevUsers, newUser]);
      toast({ title: 'Usuario Agregado', description: `El usuario ${userData.name} (${userData.role}) ha sido agregado.` });
    }
    setIsAddEditUserDialogOpen(false);
  };

  const handleOpenDeleteUserDialog = (user: User) => {
    if (loggedInUser && user.id === loggedInUser.id) {
      toast({ variant: "destructive", title: "Operación no permitida", description: "No puedes eliminarte a ti mismo." });
      return;
    }
    setUserToDelete(user);
    setIsConfirmDeleteUserOpen(true);
  };

  const executeDeleteUser = () => {
    if (!userToDelete) return;

    setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
    // Note: Invoice de-assignment logic is not present here as `invoices` state is in HomePage.
    // This is a limitation of not having a shared state/backend.
    if (userToDelete.role === 'repartidor') {
      toast({ title: 'Usuario Eliminado', description: `El repartidor ${userToDelete.name} ha sido eliminado. (La desasignación de facturas no se refleja globalmente en este prototipo).` });
    } else {
      toast({ title: 'Usuario Eliminado', description: `El usuario ${userToDelete.name} ha sido eliminado.` });
    }
    
    setUserToDelete(null);
    setIsConfirmDeleteUserOpen(false);
  };

  const filteredAdminUsers = useMemo(() => {
    if (adminUserListRoleFilter === 'all') {
      return users.sort((a, b) => a.name.localeCompare(b.name)); 
    }
    return users.filter(user => user.role === adminUserListRoleFilter).sort((a, b) => a.name.localeCompare(b.name));
  }, [users, adminUserListRoleFilter]);

  if (!loggedInUser || loggedInUser.role !== 'administrador') {
    // This check is mostly for initial render before useEffect kicks in, or if state somehow gets reset.
    // The useEffect handles the redirection.
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
            <p className="text-lg text-foreground">Redirigiendo...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader loggedInUser={loggedInUser} onLogout={handleSimulatedLogout} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
            <Button variant="outline" onClick={() => router.push('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Panel Principal
            </Button>
        </div>

        <section>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center">
                    <UsersIconLucide className="mr-3 h-8 w-8 text-primary" />
                    Gestión de Usuarios del Sistema
                </h1>
                <Button onClick={handleOpenAddUserDialog} variant="default">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Agregar Nuevo Usuario
                </Button>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Lista de Usuarios</CardTitle>
                    <CardDescription>Filtra, edita o elimina usuarios del sistema.</CardDescription>
                    <div className="pt-4">
                        <Label htmlFor="admin-user-role-filter" className="mb-2 block text-sm font-medium text-muted-foreground">
                            <Filter className="inline-block h-4 w-4 mr-1" />
                            Filtrar por Rol:
                        </Label>
                        <Select
                            value={adminUserListRoleFilter}
                            onValueChange={(value) => setAdminUserListRoleFilter(value as UserRole | 'all')}
                            name="admin-user-role-filter"
                        >
                            <SelectTrigger className="w-full sm:w-[240px] h-10 text-sm">
                            <SelectValue placeholder="Seleccionar rol para filtrar..." />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="all">Todos los Roles</SelectItem>
                            {adminAvailableRolesForFilter.map(role => (
                                <SelectItem key={role} value={role}>
                                {adminRoleDisplayInfo[role]?.label || role.charAt(0).toUpperCase() + role.slice(1)}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[60vh] min-h-[300px] pr-1"> {/* Container for ScrollArea */}
                         <ScrollArea className="h-full" scrollbarProps={{ type: "always" }}>
                            <div className="space-y-3">
                            {filteredAdminUsers.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                No hay usuarios que coincidan con el filtro "{adminUserListRoleFilter === 'all' ? 'Todos los Roles' : adminRoleDisplayInfo[adminUserListRoleFilter]?.label}".
                                </p>
                            ) : (
                                filteredAdminUsers.map((user) => {
                                const displayInfo = adminRoleDisplayInfo[user.role] || { Icon: UserIconLucide, label: user.role };
                                const isCurrentUser = user.id === loggedInUser?.id;
                                const isEditingOtherAdmin = user.role === 'administrador' && user.id !== loggedInUser?.id;
                                const canEdit = !((isCurrentUser && user.role === 'administrador') || isEditingOtherAdmin);

                                return (
                                    <Card key={user.id} className="shadow-md hover:shadow-lg transition-shadow duration-200">
                                    <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                        <displayInfo.Icon className={cn("h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0",
                                            user.role === 'administrador' ? 'text-purple-600' :
                                            user.role === 'supervisor' ? 'text-blue-500' :
                                            user.role === 'repartidor' ? 'text-green-500' : 'text-primary'
                                        )} />
                                        <div className="flex-grow min-w-0">
                                            <span className="font-semibold block truncate text-foreground text-sm sm:text-base" title={user.name}>{user.name}</span>
                                            <Badge variant={user.role === 'administrador' || user.role === 'supervisor' || user.role === 'repartidor' ? "default" : "secondary"}
                                                    className={cn("text-xs", displayInfo.badgeClass)}>
                                            {displayInfo.label}
                                            </Badge>
                                        </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleOpenEditUserDialog(user)}
                                            aria-label={`Editar ${user.name}`}
                                            className="h-8 w-8 sm:h-9 sm:w-9"
                                            disabled={!canEdit}
                                            title={
                                            !canEdit ? (user.role === 'administrador' ? "El rol de administrador no se puede cambiar aquí." : `Editar ${user.name}`) : `Editar ${user.name}`
                                            }
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleOpenDeleteUserDialog(user)}
                                            aria-label={`Eliminar ${user.name}`}
                                            className="h-8 w-8 sm:h-9 sm:w-9"
                                            disabled={isCurrentUser}
                                            title={isCurrentUser ? "No puedes eliminarte a ti mismo" : `Eliminar ${user.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        </div>
                                    </CardContent>
                                    </Card>
                                );
                                })
                            )}
                            </div>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>
        </section>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © 2025 SnapClaim. All rights reserved.
      </footer>

      <AddEditUserDialog
            isOpen={isAddEditUserDialogOpen}
            onOpenChange={setIsAddEditUserDialogOpen}
            userToEdit={userToEdit}
            onSave={handleSaveUser}
            availableRoles={manageableUserRoles}
            currentUser={loggedInUser}
        />
        {userToDelete && (
            <ConfirmDialog
                isOpen={isConfirmDeleteUserOpen}
                onOpenChange={setIsConfirmDeleteUserOpen}
                title={`Confirmar Eliminación de ${userToDelete.name}`}
                description={`¿Estás seguro de que quieres eliminar a ${userToDelete.name} (${userToDelete.role})? Esta acción no se puede deshacer.${userToDelete.role === 'repartidor' ? ' (Las facturas asignadas no se desasignan globalmente en este prototipo).' : ''}`}
                onConfirm={executeDeleteUser}
                confirmButtonText="Eliminar Usuario"
            />
        )}
      <Toaster />
    </div>
  );
}
