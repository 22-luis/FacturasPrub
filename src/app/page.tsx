
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
// Link component might be used later, keeping it for now.
// import Link from 'next/link'; 
import { AppHeader } from '@/components/AppHeader';
import { InvoiceCard } from '@/components/InvoiceCard';
import { ProcessInvoiceDialog } from '@/components/ProcessInvoiceDialog';
import { AddEditInvoiceDialog } from '@/components/AddEditInvoiceDialog';
import { AddRepartidorDialog } from '@/components/AddRepartidorDialog';
import { ManageRepartidoresDialog } from '@/components/ManageRepartidoresDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AddEditUserDialog } from '@/components/AddEditUserDialog';
import { ManageAllUsersDialog } from '@/components/ManageAllUsersDialog';

import type { AssignedInvoice, User, InvoiceFormData, InvoiceStatus, UserRole } from '@/lib/types';
import { Toaster } from "@/components/ui/toaster";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, UserSquare2, Archive, UserPlus, LogIn, AlertTriangle, CheckCircle2, XCircle, ListFilter, Users, Search, Filter, Settings2, Users2 as UsersIconLucide } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const UNASSIGNED_KEY = "unassigned_invoices_key";
const ALL_REPARTIDORES_KEY = "all_repartidores_filter_key";
const invoiceStatusesArray: InvoiceStatus[] = ['PENDIENTE', 'ENTREGADA', 'CANCELADA'];


const statusCardDetails: Record<InvoiceStatus, { label: string; Icon: React.ElementType; description: string }> = {
  PENDIENTE: { label: 'Facturas Pendientes', Icon: AlertTriangle, description: "Revisar y procesar" },
  ENTREGADA: { label: 'Facturas Entregadas', Icon: CheckCircle2, description: "Confirmadas y finalizadas" },
  CANCELADA: { label: 'Facturas Canceladas', Icon: XCircle, description: "Anuladas del sistema" },
};

// const adminRoleDisplayInfo is now defined in ManageAllUsersDialog
const manageableUserRoles: UserRole[] = ['supervisor', 'repartidor']; 


export default function HomePage() {
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processingInvoice, setProcessingInvoice] = useState<AssignedInvoice | null>(null);

  const [isAddEditInvoiceDialogOpen, setIsAddEditInvoiceDialogOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<AssignedInvoice | null>(null);

  const [isAddRepartidorDialogOpen, setIsAddRepartidorDialogOpen] = useState(false);
  const [repartidorToEditFromSupervisor, setRepartidorToEditFromSupervisor] = useState<User | null>(null);
  const [isManageRepartidoresOpen, setIsManageRepartidoresOpen] = useState(false);
  const [isConfirmDeleteRepartidorOpen, setIsConfirmDeleteRepartidorOpen] = useState(false);
  const [repartidorToDelete, setRepartidorToDelete] = useState<User | null>(null);

  const [isAddEditUserDialogOpen, setIsAddEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isConfirmDeleteUserOpen, setIsConfirmDeleteUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isManageAllUsersDialogOpen, setIsManageAllUsersDialogOpen] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [invoices, setInvoices] = useState<AssignedInvoice[]>([]);
  const { toast } = useToast();

  const [selectedRepartidorIdBySupervisor, setSelectedRepartidorIdBySupervisor] = useState<string | null>(ALL_REPARTIDORES_KEY);
  const [selectedStatusBySupervisor, setSelectedStatusBySupervisor] = useState<InvoiceStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      const data: User[] = await response.json();
      setUsers(data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Cargar Usuarios', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchInvoices = useCallback(async (queryParams: Record<string, string> = {}) => {
    setIsLoading(true);
    try {
      const url = new URL('/api/invoices', window.location.origin);
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch invoices' }));
        throw new Error(errorData.error || 'Failed to fetch invoices');
      }
      const data: AssignedInvoice[] = await response.json();
      setInvoices(data);
    } catch (error: any) {
      setInvoices([]); // Clear invoices on error to avoid displaying stale data
      toast({ variant: 'destructive', title: 'Error al Cargar Facturas', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchUsers();
    // Invoices are now fetched based on loggedInUser state changes
  }, [fetchUsers]);

  useEffect(() => {
    if (loggedInUser) {
      if (loggedInUser.role === 'repartidor') {
        fetchInvoices({ assigneeId: loggedInUser.id, status: 'PENDIENTE' });
      } else if (loggedInUser.role === 'supervisor' || loggedInUser.role === 'administrador') {
        fetchInvoices(); // Fetch all for supervisor/admin
        setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY); // Reset filters
        setSelectedStatusBySupervisor(null);
        setSearchTerm('');
      }
    } else { // When loggedInUser becomes null (logout or initial state)
      setInvoices([]); // Clear invoices
      setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY);
      setSelectedStatusBySupervisor(null);
      setSearchTerm('');
    }
  }, [loggedInUser, fetchInvoices]);


  const handleLogin = async () => {
    if (!usernameInput.trim() || !passwordInput) {
      toast({ variant: "destructive", title: "Error", description: "Por favor, ingresa tu nombre de usuario y contraseña." });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: usernameInput.trim(), password: passwordInput }),
      });
      const data = await response.json(); // data.role should be lowercase now
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setLoggedInUser(data);
      toast({ title: "Sesión Iniciada", description: `Bienvenido ${data.name}.` });
      setUsernameInput('');
      setPasswordInput('');
      // No need to call fetchInvoices here, the useEffect for loggedInUser will handle it.
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error de Inicio de Sesión", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    toast({ title: "Sesión Cerrada", description: `Hasta luego ${loggedInUser?.name}.` });
    setLoggedInUser(null); // This will trigger the useEffect to clear invoices and filters
    setUsernameInput('');
    setPasswordInput('');
  };

  const handleProcessInvoiceClick = (invoiceId: string) => {
    const invoiceToProcess = invoices.find(inv => inv.id === invoiceId);
    if (invoiceToProcess) {
      setProcessingInvoice(invoiceToProcess);
      setIsProcessDialogOpen(true);
    }
  };

  const handleAddInvoiceClick = () => {
    setInvoiceToEdit(null);
    setIsAddEditInvoiceDialogOpen(true);
  };

  const handleEditInvoiceClick = (invoiceId: string) => {
    const invoiceToEditDetails = invoices.find(inv => inv.id === invoiceId);
    if (invoiceToEditDetails) {
      setInvoiceToEdit(invoiceToEditDetails);
      setIsAddEditInvoiceDialogOpen(true);
    }
  };

  const handleSaveInvoice = async (invoiceData: InvoiceFormData, id?: string) => {
    setIsLoading(true);
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/invoices/${id}` : '/api/invoices';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || (id ? 'Failed to update invoice' : 'Failed to create invoice'));
      }
      toast({ title: id ? "Factura Actualizada" : "Factura Agregada", description: `La factura #${result.invoiceNumber} ha sido ${id ? 'actualizada' : 'agregada'}.` });
      setIsAddEditInvoiceDialogOpen(false);
      // Refetch invoices based on current user's role and filters
      if (loggedInUser) {
        if (loggedInUser.role === 'repartidor') {
          fetchInvoices({ assigneeId: loggedInUser.id, status: 'PENDIENTE' });
        } else {
          fetchInvoices(); // Or apply current supervisor/admin filters if any
        }
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Guardar Factura', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: InvoiceStatus, cancellationReason?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, cancellationReason }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update invoice status');
      }
      toast({ title: 'Estado Actualizado', description: `La factura #${result.invoiceNumber} ha sido actualizada a ${newStatus.toLowerCase()}.`});
      // Refetch invoices based on current user's role and filters
      if (loggedInUser) {
         if (loggedInUser.role === 'repartidor') {
          fetchInvoices({ assigneeId: loggedInUser.id, status: 'PENDIENTE' });
        } else {
          fetchInvoices(); // Or apply current supervisor/admin filters if any
        }
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Actualizar Estado', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenAddRepartidorDialog = () => {
    setRepartidorToEditFromSupervisor(null);
    setIsAddRepartidorDialogOpen(true);
  };

  const handleOpenEditRepartidorDialog = (repartidor: User) => {
    setRepartidorToEditFromSupervisor(repartidor);
    setIsAddRepartidorDialogOpen(true);
  };

  // For supervisor adding/editing repartidor (role is fixed to 'repartidor')
  const handleSaveRepartidorBySupervisor = async (name: string, idToEdit?: string, password?: string) => {
    const userData = { name, role: 'repartidor' as UserRole, password }; // role is lowercase
    await handleSaveUser(userData, idToEdit, true); 
  };


  const handleOpenDeleteRepartidorDialog = (repartidor: User) => {
    setRepartidorToDelete(repartidor);
    setIsConfirmDeleteRepartidorOpen(true);
  };

  const executeDeleteRepartidorBySupervisor = async () => {
    if (!repartidorToDelete) return;
    await executeDeleteUser(repartidorToDelete, true); 
  };


  const handleOpenAddUserDialog = () => {
    setUserToEdit(null);
    setIsAddEditUserDialogOpen(true);
  };

  const handleOpenEditUserDialog = (user: User) => {
    setUserToEdit(user);
    setIsAddEditUserDialogOpen(true);
  };

  const handleOpenDeleteUserDialog = (user: User) => {
    if (loggedInUser && user.id === loggedInUser.id) {
      toast({ variant: "destructive", title: "Operación no permitida", description: "No puedes eliminarte a ti mismo." });
      return;
    }
    setUserToDelete(user);
    setIsConfirmDeleteUserOpen(true);
  };

  const handleSaveUser = async (userData: { name: string; role: UserRole; password?: string }, idToEdit?: string, isSupervisorAction: boolean = false) => {
    setIsLoading(true);
    const method = idToEdit ? 'PUT' : 'POST';
    const endpoint = idToEdit ? `/api/users/${idToEdit}` : '/api/users';

    // userData.role is already lowercase here from AddEditUserDialog or AddRepartidorDialog
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData), // Sending lowercase role
      });
      const result = await response.json(); // API will return lowercase role
      if (!response.ok) {
        throw new Error(result.error || (idToEdit ? 'Failed to update user' : 'Failed to create user'));
      }
      
      const actionText = isSupervisorAction ? (idToEdit ? 'Repartidor Actualizado' : 'Repartidor Agregado') : (idToEdit ? 'Usuario Actualizado' : 'Usuario Agregado');
      const descriptionText = isSupervisorAction 
        ? (idToEdit ? `El repartidor ${result.name} ha sido actualizado.` : `El repartidor ${result.name} ha sido agregado.`)
        : (idToEdit ? `Los datos de ${result.name} han sido actualizados.` : `El usuario ${result.name} (${result.role}) ha sido agregado.`);
      
      toast({ title: actionText, description: descriptionText });
      
      if (isSupervisorAction) setIsAddRepartidorDialogOpen(false);
      else setIsAddEditUserDialogOpen(false);
      
      fetchUsers(); // Refetch all users
    } catch (error: any) {
      toast({ variant: 'destructive', title: isSupervisorAction ? 'Error al Guardar Repartidor' : 'Error al Guardar Usuario', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const executeDeleteUser = async (userToDeleteParam?: User, isSupervisorAction: boolean = false) => {
    const targetUser = userToDeleteParam || userToDelete;
    if (!targetUser) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${targetUser.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }
      
      const titleText = isSupervisorAction ? 'Repartidor Eliminado' : 'Usuario Eliminado';
      const descriptionText = isSupervisorAction 
        ? `El repartidor ${targetUser.name} ha sido eliminado.`
        : `El usuario ${targetUser.name} ha sido eliminado.`;

      toast({ title: titleText, description: descriptionText });

      fetchUsers(); // Refetch users
      // If a repartidor was deleted, their invoices become unassigned, refetch invoices for supervisor/admin
      if (targetUser.role === 'repartidor' && loggedInUser && (loggedInUser.role === 'supervisor' || loggedInUser.role === 'administrador')) {
        fetchInvoices(); 
        if (selectedRepartidorIdBySupervisor === targetUser.id) {
          setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY); // Reset filter if deleted repartidor was selected
        }
      }
      
      if (isSupervisorAction) {
        setRepartidorToDelete(null);
        setIsConfirmDeleteRepartidorOpen(false);
      } else {
        setUserToDelete(null);
        setIsConfirmDeleteUserOpen(false);
      }

    } catch (error: any) {
      toast({ variant: 'destructive', title: isSupervisorAction ? 'Error al Eliminar Repartidor' : 'Error al Eliminar Usuario', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getAssigneeName = (assigneeId?: string | null): string | undefined => {
    if (!assigneeId) return undefined;
    // Users list should have all users with lowercase roles
    let repartidor = users.find(u => u.id === assigneeId && u.role === 'repartidor');
    if (repartidor) return repartidor.name;

    const invoiceWithAssignee = invoices.find(inv => inv.id === processingInvoice?.id || inv.id === invoiceToEdit?.id);
    if (invoiceWithAssignee?.assignee?.id === assigneeId) {
        return invoiceWithAssignee.assignee.name; // API includes assignee with lowercase role
    }
    return users.find(u => u.id === assigneeId)?.name; 
  };


  const repartidores = useMemo(() => users.filter(user => user.role === 'repartidor'), [users]); // Role check is lowercase

  const displayedInvoices = useMemo(() => {
    if (!loggedInUser) return [];

    let filteredInvoices = [...invoices];

    if (loggedInUser.role === 'supervisor' || loggedInUser.role === 'administrador') { // lowercase check
      if (searchTerm.trim()) {
        const lowerSearchTerm = searchTerm.trim().toLowerCase();
        filteredInvoices = filteredInvoices.filter(inv =>
          inv.supplierName.toLowerCase().includes(lowerSearchTerm) ||
          inv.invoiceNumber.toLowerCase().includes(lowerSearchTerm) ||
          (inv.uniqueCode && inv.uniqueCode.toLowerCase().includes(lowerSearchTerm))
        );
      }

      if (selectedStatusBySupervisor) {
        filteredInvoices = filteredInvoices.filter(inv => inv.status === selectedStatusBySupervisor);
      }

      if (selectedRepartidorIdBySupervisor === UNASSIGNED_KEY) {
        filteredInvoices = filteredInvoices.filter(inv => !inv.assigneeId);
      } else if (selectedRepartidorIdBySupervisor && selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY) {
        filteredInvoices = filteredInvoices.filter(inv => inv.assigneeId === selectedRepartidorIdBySupervisor);
      }

      return filteredInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    if (loggedInUser.role === 'repartidor') { // lowercase check
      // For repartidor, invoices state should already be filtered by API call in useEffect
      return invoices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return [];
  }, [loggedInUser, invoices, selectedRepartidorIdBySupervisor, selectedStatusBySupervisor, searchTerm]);


  const getInvoicesTitleForSupervisorOrAdmin = () => {
    let titleParts: string[] = [];
    let baseTitle = "Facturas";

    if (searchTerm.trim()) {
      titleParts.push(`Resultados para "${searchTerm.trim()}"`);
    }

    let statusDescription = "Todos los Estados";
    if (selectedStatusBySupervisor) {
        const statusDetail = statusCardDetails[selectedStatusBySupervisor];
        statusDescription = statusDetail ? statusDetail.label : `Facturas ${selectedStatusBySupervisor.toLowerCase()}`;
    }

    let repartidorDescription = "Todas las Facturas";
    if (selectedRepartidorIdBySupervisor === UNASSIGNED_KEY) {
        repartidorDescription = "Facturas sin Asignar";
    } else if (selectedRepartidorIdBySupervisor && selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY) {
        const repartidor = users.find(u => u.id === selectedRepartidorIdBySupervisor); // users have lowercase roles
        if (repartidor) {
            repartidorDescription = `Asignadas a: ${repartidor.name}`;
        } else {
           repartidorDescription = "Repartidor no encontrado";
        }
    }

    if (searchTerm.trim()) {
        let specifics = [];
        if (selectedStatusBySupervisor) specifics.push(statusDescription.toLowerCase());
        if (selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY && selectedRepartidorIdBySupervisor !== UNASSIGNED_KEY) specifics.push(repartidorDescription.toLowerCase());
        else if (selectedRepartidorIdBySupervisor === UNASSIGNED_KEY) specifics.push("sin asignar");


        if (specifics.length > 0) {
          return `${titleParts[0]} (${specifics.join(', ')})`;
        }
        return titleParts[0];
    }

    if (selectedStatusBySupervisor && selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY) {
        return `${statusDescription} (${repartidorDescription})`;
    }
    if (selectedStatusBySupervisor) {
        return statusDescription;
    }
    if (selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY) {
        return repartidorDescription;
    }

    return baseTitle;
  };


  if (!loggedInUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader loggedInUser={null} onLogout={() => {}} />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-semibold text-foreground">Iniciar Sesión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                <div>
                  <Label htmlFor="username-login" className="mb-2 block text-sm font-medium text-foreground">
                    Nombre de Usuario:
                  </Label>
                  <Input
                    id="username-login"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Ej: admin"
                    required
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="password-login" className="mb-2 block text-sm font-medium text-foreground">
                    Contraseña:
                  </Label>
                  <Input
                    id="password-login"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Contraseña"
                    required
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Ingresando...' : <><LogIn className="mr-2 h-5 w-5" /> Entrar</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
        <footer className="py-6 text-center text-sm text-muted-foreground border-t">
          © 2025 SnapClaim. All rights reserved.
        </footer>
        <Toaster />
      </div>
    );
  }

  // These role checks will now work correctly because loggedInUser.role is lowercase
  const isSupervisor = loggedInUser.role === 'supervisor';
  const isAdmin = loggedInUser.role === 'administrador';
  const isSupervisorOrAdmin = isSupervisor || isAdmin;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader loggedInUser={loggedInUser} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {isSupervisorOrAdmin && (
          <section className="space-y-8">
            <div>
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                  {isAdmin ? 'Panel de Administrador' : 'Panel de Supervisor'}
                </h2>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleAddInvoiceClick} disabled={isLoading}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Factura
                  </Button>
                  {isSupervisor && !isAdmin && (
                    <>
                      <Button onClick={handleOpenAddRepartidorDialog} variant="outline" disabled={isLoading}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Agregar Repartidor
                      </Button>
                      <Button onClick={() => setIsManageRepartidoresOpen(true)} variant="outline" disabled={isLoading || repartidores.length === 0}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        Gestionar Repartidores
                      </Button>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <Button onClick={handleOpenAddUserDialog} variant="outline" disabled={isLoading}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Agregar Usuario
                      </Button>
                       <Button onClick={() => setIsManageAllUsersDialogOpen(true)} variant="outline" disabled={isLoading || users.length === 0}>
                        <UsersIconLucide className="mr-2 h-4 w-4" />
                        Gestionar Usuarios
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <Card className="shadow-sm border">
                    <AccordionTrigger className="w-full p-0 hover:no-underline">
                      <CardHeader className="flex-1">
                          <CardTitle className="text-lg flex items-center w-full">
                            <div className="flex items-center gap-2">
                              <Filter className="h-5 w-5 text-primary" />
                              Opciones de Filtrado y Búsqueda de Facturas
                            </div>
                          </CardTitle>
                      </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent>
                      <CardContent className="pt-2 space-y-6">
                          <div className="relative">
                            <Label htmlFor="search-invoices" className="sr-only">Buscar facturas</Label>
                            <Input
                              id="search-invoices"
                              type="text"
                              placeholder="Buscar por proveedor, N° factura o código..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 w-full"
                              disabled={isLoading}
                            />
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                          </div>

                          <div>
                            <h3 className="text-base font-medium text-foreground mb-3">Filtrar Facturas por Estado:</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              {invoiceStatusesArray.map(status => {
                                const details = statusCardDetails[status];
                                return (
                                  <Card
                                    key={status}
                                    className={cn(
                                      "cursor-pointer transition-shadow",
                                      selectedStatusBySupervisor === status ? 'ring-2 ring-primary shadow-md' : 'border hover:shadow-md',
                                      isLoading && 'opacity-50 cursor-not-allowed'
                                    )}
                                    onClick={() => !isLoading && setSelectedStatusBySupervisor(prev => prev === status ? null : status)}
                                  >
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                                      <CardTitle className="text-xs font-medium">{details.label}</CardTitle>
                                      <details.Icon className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="px-3 pb-2">
                                      <p className="text-xs text-muted-foreground">{details.description}</p>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => !isLoading && setSelectedStatusBySupervisor(null)}
                                className={cn(
                                  "h-full whitespace-normal text-left justify-start items-center transition-shadow hover:shadow-md text-xs py-2 px-3",
                                  !selectedStatusBySupervisor ? 'ring-2 ring-primary shadow-md' : 'hover:bg-background hover:text-foreground',
                                   isLoading && 'opacity-50 cursor-not-allowed'
                                )}
                                disabled={isLoading}
                              >
                                <ListFilter className="mr-2 h-3 w-3" />
                                Mostrar Todos los Estados
                              </Button>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-base font-medium text-foreground mb-3">Filtrar Facturas por Repartidor:</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => !isLoading && setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY)}
                                    className={cn(
                                      "h-full whitespace-normal text-left justify-start items-center transition-shadow hover:shadow-md text-xs py-2 px-3",
                                      selectedRepartidorIdBySupervisor === ALL_REPARTIDORES_KEY ? 'ring-2 ring-primary shadow-md' : 'hover:bg-background hover:text-foreground',
                                      isLoading && 'opacity-50 cursor-not-allowed'
                                    )}
                                    disabled={isLoading}
                                  >
                                    <Users className="mr-2 h-3 w-3" />
                                    Mostrar Todas las Facturas
                                </Button>

                                {repartidores.map(repartidor => (
                                  <Card
                                    key={repartidor.id}
                                    className={cn(
                                        "cursor-pointer transition-shadow",
                                        selectedRepartidorIdBySupervisor === repartidor.id ? 'ring-2 ring-primary shadow-md' : 'border hover:shadow-md',
                                        isLoading && 'opacity-50 cursor-not-allowed'
                                    )}
                                    onClick={() => !isLoading && setSelectedRepartidorIdBySupervisor(prev => prev === repartidor.id ? ALL_REPARTIDORES_KEY : repartidor.id)}
                                  >
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                                      <CardTitle className="text-xs font-medium">{repartidor.name}</CardTitle>
                                      <UserSquare2 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="px-3 pb-2">
                                      <div className="text-xs text-muted-foreground">Rol: repartidor</div>
                                    </CardContent>
                                  </Card>
                                ))}
                                <Card
                                  key={UNASSIGNED_KEY}
                                  className={cn(
                                    "cursor-pointer transition-shadow",
                                    selectedRepartidorIdBySupervisor === UNASSIGNED_KEY ? 'ring-2 ring-primary shadow-md' : 'border hover:shadow-md',
                                     isLoading && 'opacity-50 cursor-not-allowed'
                                  )}
                                  onClick={() => !isLoading && setSelectedRepartidorIdBySupervisor(prev => prev === UNASSIGNED_KEY ? ALL_REPARTIDORES_KEY : UNASSIGNED_KEY)}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                                    <CardTitle className="text-xs font-medium">Facturas sin Asignar</CardTitle>
                                    <Archive className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="px-3 pb-2">
                                    <div className="text-xs text-muted-foreground">Ver no asignadas</div>
                                    </CardContent>
                                </Card>
                                {repartidores.length === 0 && !isLoading && (
                                     <p className="text-muted-foreground mt-2 text-sm p-2 md:col-span-4 text-center">No hay repartidores. Agrega uno para asignar facturas.</p>
                                )}
                            </div>
                          </div>
                        </CardContent>
                      </AccordionContent>
                    </Card>
                </AccordionItem>
              </Accordion>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground my-6">
                {getInvoicesTitleForSupervisorOrAdmin()}
              </h3>
              {isLoading && displayedInvoices.length === 0 && <p className="text-muted-foreground">Cargando facturas...</p>}
              {!isLoading && displayedInvoices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedInvoices.map(invoice => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      onAction={isAdmin || isSupervisor ? handleEditInvoiceClick : handleProcessInvoiceClick}
                      currentUserRole={loggedInUser?.role} // Role is lowercase
                      assigneeName={invoice.assignee?.name || getAssigneeName(invoice.assigneeId)}
                    />
                  ))}
                </div>
              ) : (
                !isLoading && <p className="text-muted-foreground">
                  {searchTerm.trim() ? `No se encontraron facturas para "${searchTerm.trim()}" con los filtros seleccionados.` : `No se encontraron facturas que coincidan con los filtros seleccionados.`}
                </p>
              )}
            </div>
          </section>
        )}

        {loggedInUser.role === 'repartidor' && ( // Role check is lowercase
           <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Mis Facturas Pendientes</h2>
            {isLoading && displayedInvoices.length === 0 && <p className="text-muted-foreground">Cargando tus facturas...</p>}
            {!isLoading && displayedInvoices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedInvoices.map(invoice => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    onAction={handleProcessInvoiceClick}
                    currentUserRole={loggedInUser?.role} // Role is lowercase
                  />
                ))}
              </div>
            ) : (
             !isLoading && <p className="text-muted-foreground">No tienes facturas pendientes asignadas en este momento.</p>
            )}
          </section>
        )}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © 2025 SnapClaim. All rights reserved.
      </footer>

      <ProcessInvoiceDialog
        isOpen={isProcessDialogOpen}
        onOpenChange={setIsProcessDialogOpen}
        invoice={processingInvoice}
        onUpdateStatus={handleUpdateInvoiceStatus}
      />
      <AddEditInvoiceDialog
        isOpen={isAddEditInvoiceDialogOpen}
        onOpenChange={setIsAddEditInvoiceDialogOpen}
        invoiceToEdit={invoiceToEdit}
        users={repartidores} // Pass only repartidores for assignment
        onSave={handleSaveInvoice}
      />

      {isSupervisor && !isAdmin && ( // Role checks are lowercase
        <>
          <AddRepartidorDialog
            isOpen={isAddRepartidorDialogOpen}
            onOpenChange={setIsAddRepartidorDialogOpen}
            onSave={handleSaveRepartidorBySupervisor}
            repartidorToEdit={repartidorToEditFromSupervisor}
          />
          <ManageRepartidoresDialog
            isOpen={isManageRepartidoresOpen}
            onOpenChange={setIsManageRepartidoresOpen}
            repartidores={repartidores}
            onEdit={handleOpenEditRepartidorDialog}
            onDelete={handleOpenDeleteRepartidorDialog}
          />
          {repartidorToDelete && (
            <ConfirmDialog
                isOpen={isConfirmDeleteRepartidorOpen}
                onOpenChange={setIsConfirmDeleteRepartidorOpen}
                title={`Confirmar Eliminación de ${repartidorToDelete.name}`}
                description={`¿Estás seguro de que quieres eliminar a ${repartidorToDelete.name}? Esta acción no se puede deshacer. Las facturas asignadas a este repartidor pasarán a estar "Sin asignar".`}
                onConfirm={executeDeleteRepartidorBySupervisor}
                confirmButtonText="Eliminar Repartidor"
            />
          )}
        </>
      )}

      {isAdmin && ( // Role check is lowercase
          <>
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
                    description={`¿Estás seguro de que quieres eliminar a ${userToDelete.name} (${userToDelete.role})? Esta acción no se puede deshacer.${userToDelete.role === 'repartidor' ? ' Las facturas asignadas también se desasignarán.' : ''}`}
                    onConfirm={() => executeDeleteUser()}
                    confirmButtonText="Eliminar Usuario"
                />
            )}
            <ManageAllUsersDialog
                isOpen={isManageAllUsersDialogOpen}
                onOpenChange={setIsManageAllUsersDialogOpen}
                allUsers={users} // Pass all users (roles are lowercase)
                currentUser={loggedInUser} // Role is lowercase
                onEdit={handleOpenEditUserDialog}
                onDelete={handleOpenDeleteUserDialog}
            />
          </>
      )}
      <Toaster />
    </div>
  );
}
