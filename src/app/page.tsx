
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { InvoiceCard } from '@/components/InvoiceCard';
import { ProcessInvoiceDialog } from '@/components/ProcessInvoiceDialog';
import { AddEditInvoiceDialog } from '@/components/AddEditInvoiceDialog';
import { AddRepartidorDialog } from '@/components/AddRepartidorDialog';
import { ManageRepartidoresDialog } from '@/components/ManageRepartidoresDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AddEditUserDialog } from '@/components/AddEditUserDialog';
import { ManageAllUsersDialog } from '@/components/ManageAllUsersDialog';

import { mockInvoices, mockUsers, generateInvoiceId, generateUserId } from '@/lib/types';
import type { AssignedInvoice, User, InvoiceFormData, InvoiceStatus, UserRole } from '@/lib/types';
import { Toaster } from "@/components/ui/toaster";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, UserSquare2, Archive, UserPlus, LogIn, AlertTriangle, CheckCircle2, XCircle, ListFilter, Users, Search, Filter, Settings2, Users2 as UsersIconLucide, ArrowLeft, ShieldAlert, ShieldCheck, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


const UNASSIGNED_KEY = "unassigned_invoices_key";
const ALL_REPARTIDORES_KEY = "all_repartidores_filter_key";
const invoiceStatusesArray: InvoiceStatus[] = ['PENDIENTE', 'ENTREGADA', 'CANCELADA'];


const statusCardDetails: Record<InvoiceStatus, { label: string; Icon: React.ElementType; description: string }> = {
  PENDIENTE: { label: 'Facturas Pendientes', Icon: AlertTriangle, description: "Revisar y procesar" },
  ENTREGADA: { label: 'Facturas Entregadas', Icon: CheckCircle2, description: "Confirmadas y finalizadas" },
  CANCELADA: { label: 'Facturas Canceladas', Icon: XCircle, description: "Anuladas del sistema" },
};

const adminRoleDisplayInfo: Record<UserRole, { Icon: React.ElementType; label: string, badgeClass?: string }> = {
  administrador: { Icon: ShieldAlert, label: 'Administrador', badgeClass: 'bg-purple-600 text-white hover:bg-purple-700' },
  supervisor: { Icon: ShieldCheck, label: 'Supervisor', badgeClass: 'bg-blue-500 text-white hover:bg-blue-600' },
  repartidor: { Icon: UserSquare2, label: 'Repartidor', badgeClass: 'bg-green-500 text-white hover:bg-green-600' },
};
const adminAvailableRolesForFilter: UserRole[] = ['administrador', 'supervisor', 'repartidor'];
const manageableUserRoles: UserRole[] = ['supervisor', 'repartidor']; // Roles an admin can assign/create (excluding other admins)


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


  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [invoices, setInvoices] = useState<AssignedInvoice[]>(mockInvoices);
  const { toast } = useToast();

  const [selectedRepartidorIdBySupervisor, setSelectedRepartidorIdBySupervisor] = useState<string | null>(ALL_REPARTIDORES_KEY);
  const [selectedStatusBySupervisor, setSelectedStatusBySupervisor] = useState<InvoiceStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    if (!loggedInUser) {
      setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY);
      setSelectedStatusBySupervisor(null);
      setSearchTerm('');
    }
  }, [loggedInUser]);

  const handleLogin = () => {
    if (!usernameInput.trim() || !passwordInput) {
      toast({ variant: "destructive", title: "Error", description: "Por favor, ingresa tu nombre de usuario y contraseña." });
      return;
    }
    const user = users.find(u => u.name.toLowerCase() === usernameInput.trim().toLowerCase());

    if (user && user.password === passwordInput) {
      setLoggedInUser(user);
      toast({ title: "Sesión Iniciada", description: `Bienvenido ${user.name}.` });
      setUsernameInput('');
      setPasswordInput('');
      if (user.role === 'supervisor' || user.role === 'administrador') {
        setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY);
        setSelectedStatusBySupervisor(null);
        setSearchTerm('');
      }
    } else {
      toast({ variant: "destructive", title: "Error de Inicio de Sesión", description: "Nombre de usuario o contraseña incorrectos." });
    }
  };

  const handleLogout = () => {
    toast({ title: "Sesión Cerrada", description: `Hasta luego ${loggedInUser?.name}.` });
    setLoggedInUser(null);
    setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY);
    setSelectedStatusBySupervisor(null);
    setSearchTerm('');
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

  const handleSaveInvoice = (invoiceData: InvoiceFormData, id?: string) => {
    if (id) {
      setInvoices(prevInvoices =>
        prevInvoices.map(inv =>
          inv.id === id ? { ...inv, ...invoiceData, id: inv.id } : inv
        )
      );
      toast({ title: "Factura Actualizada", description: `La factura #${invoiceData.invoiceNumber} ha sido actualizada.` });
    } else {
      const newInvoice: AssignedInvoice = {
        ...invoiceData,
        id: generateInvoiceId(),
      };
      setInvoices(prevInvoices => [newInvoice, ...prevInvoices]);
      toast({ title: "Factura Agregada", description: `La nueva factura #${newInvoice.invoiceNumber} ha sido agregada.` });
    }
    setIsAddEditInvoiceDialogOpen(false);
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, newStatus: InvoiceStatus, cancellationReason?: string) => {
    setInvoices(prevInvoices =>
      prevInvoices.map(inv =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: newStatus,
              cancellationReason: newStatus === 'CANCELADA' ? cancellationReason : inv.cancellationReason
            }
          : inv
      )
    );
     toast({
      title: 'Estado Actualizado',
      description: `La factura ha sido actualizada a ${newStatus.toLowerCase()}.`,
    });
  };

  const handleOpenAddRepartidorDialog = () => {
    setRepartidorToEditFromSupervisor(null);
    setIsAddRepartidorDialogOpen(true);
  };

  const handleOpenEditRepartidorDialog = (repartidor: User) => {
    setRepartidorToEditFromSupervisor(repartidor);
    setIsAddRepartidorDialogOpen(true);
  };

  const handleSaveRepartidor = (name: string, idToEdit?: string) => {
    if (idToEdit) {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === idToEdit ? { ...user, name } : user
        )
      );
      toast({ title: 'Repartidor Actualizado', description: `El nombre del repartidor ha sido actualizado a ${name}.` });
    } else {
      const newRepartidor: User = {
        id: generateUserId(),
        name,
        role: 'repartidor',
        password: '123', // Default password for new repartidores created by supervisor
      };
      setUsers(prevUsers => [...prevUsers, newRepartidor]);
      toast({ title: 'Repartidor Agregado', description: `El repartidor ${name} ha sido agregado al sistema.` });
    }
    setIsAddRepartidorDialogOpen(false);
  };

  const handleOpenDeleteRepartidorDialog = (repartidor: User) => {
    setRepartidorToDelete(repartidor);
    setIsConfirmDeleteRepartidorOpen(true);
  };

  const executeDeleteRepartidor = () => {
    if (!repartidorToDelete) return;

    setUsers(prevUsers => prevUsers.filter(user => user.id !== repartidorToDelete.id));
    setInvoices(prevInvoices =>
      prevInvoices.map(inv =>
        inv.assigneeId === repartidorToDelete.id ? { ...inv, assigneeId: undefined } : inv
      )
    );
    toast({ title: 'Repartidor Eliminado', description: `El repartidor ${repartidorToDelete.name} ha sido eliminado. Sus facturas han sido desasignadas.` });

    if (selectedRepartidorIdBySupervisor === repartidorToDelete.id) {
      setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY);
    }

    setRepartidorToDelete(null);
    setIsConfirmDeleteRepartidorOpen(false);
  };

  const handleOpenAddUserDialog = () => {
    setUserToEdit(null);
    setIsAddEditUserDialogOpen(true);
  };

  const handleOpenEditUserDialogFromMainPageOrModal = (user: User) => {
    setUserToEdit(user);
    setIsAddEditUserDialogOpen(true);
  };

  const handleOpenDeleteUserDialogFromMainPageOrModal = (user: User) => {
    if (loggedInUser && user.id === loggedInUser.id) {
      toast({ variant: "destructive", title: "Operación no permitida", description: "No puedes eliminarte a ti mismo." });
      return;
    }
    setUserToDelete(user);
    setIsConfirmDeleteUserOpen(true);
  };


  const handleSaveUser = (userData: { name: string; role: UserRole; password?: string }, idToEdit?: string) => {
    if (idToEdit) {
        if (loggedInUser?.id === idToEdit && loggedInUser.role === 'administrador' && userData.role !== 'administrador') {
            toast({ variant: "destructive", title: "Operación no permitida", description: "Un administrador no puede cambiar su propio rol." });
            setIsAddEditUserDialogOpen(false);
            return;
        }
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === idToEdit
            ? {
                ...user,
                name: userData.name,
                role: userData.role,
                // Update password only if a new one is provided and it's not an empty string
                password: (userData.password && userData.password.trim() !== '') ? userData.password : user.password,
              }
            : user
        )
      );
      toast({ title: 'Usuario Actualizado', description: `Los datos de ${userData.name} han sido actualizados.` });
    } else { // Adding new user
      const newUser: User = {
        id: generateUserId(),
        name: userData.name,
        role: userData.role,
        password: userData.password || '123', // Ensure new users always have a password
      };
      setUsers(prevUsers => [...prevUsers, newUser]);
      toast({ title: 'Usuario Agregado', description: `El usuario ${userData.name} (${userData.role}) ha sido agregado.` });
    }
    setIsAddEditUserDialogOpen(false);
  };

  const executeDeleteUser = () => {
    if (!userToDelete) return;

    setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
    if (userToDelete.role === 'repartidor') {
       setInvoices(prevInvoices =>
        prevInvoices.map(inv =>
          inv.assigneeId === userToDelete.id ? { ...inv, assigneeId: undefined } : inv
        )
      );
       toast({ title: 'Repartidor Eliminado', description: `El repartidor ${userToDelete.name} ha sido eliminado. Sus facturas han sido desasignadas.` });
       if (selectedRepartidorIdBySupervisor === userToDelete.id) {
         setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY);
       }
    } else {
      toast({ title: 'Usuario Eliminado', description: `El usuario ${userToDelete.name} ha sido eliminado.` });
    }

    setUserToDelete(null);
    setIsConfirmDeleteUserOpen(false);
  };


  const getAssigneeName = (assigneeId?: string): string | undefined => {
    if (!assigneeId) return undefined;
    return users.find(u => u.id === assigneeId)?.name;
  };

  const repartidores = useMemo(() => users.filter(user => user.role === 'repartidor'), [users]);

  const displayedInvoices = useMemo(() => {
    if (!loggedInUser) return [];

    let filteredInvoices = [...invoices];

    if (loggedInUser.role === 'supervisor' || loggedInUser.role === 'administrador') {
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

    if (loggedInUser.role === 'repartidor') {

      return invoices
        .filter(inv => inv.assigneeId === loggedInUser.id && inv.status === 'PENDIENTE')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
        const repartidor = users.find(u => u.id === selectedRepartidorIdBySupervisor);
        if (repartidor) {
            repartidorDescription = `Asignadas a: ${repartidor.name}`;
        } else {
           repartidorDescription = "Repartidor no encontrado";
        }
    }

    if (searchTerm.trim()) {
        let specifics = [];
        if (selectedStatusBySupervisor) specifics.push(statusDescription.toLowerCase());
        if (selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY) specifics.push(repartidorDescription.toLowerCase());

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
                    placeholder="Contraseña (ej: 123)"
                    required
                    className="w-full"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <LogIn className="mr-2 h-5 w-5" />
                  Entrar
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
                  <Button onClick={handleAddInvoiceClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Factura
                  </Button>
                  {isSupervisor && !isAdmin && (
                    <>
                      <Button onClick={handleOpenAddRepartidorDialog} variant="outline">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Agregar Repartidor
                      </Button>
                      <Button onClick={() => setIsManageRepartidoresOpen(true)} variant="outline">
                        <Settings2 className="mr-2 h-4 w-4" />
                        Gestionar Repartidores
                      </Button>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <Button onClick={handleOpenAddUserDialog} variant="outline">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Agregar Usuario
                      </Button>
                       <Button onClick={() => setIsManageAllUsersDialogOpen(true)} variant="outline">
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
                                      selectedStatusBySupervisor === status ? 'ring-2 ring-primary shadow-md' : 'border hover:shadow-md'
                                    )}
                                    onClick={() => setSelectedStatusBySupervisor(prev => prev === status ? null : status)}
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
                                onClick={() => setSelectedStatusBySupervisor(null)}
                                className={cn(
                                  "h-full whitespace-normal text-left justify-start items-center transition-shadow hover:shadow-md text-xs py-2 px-3",
                                  !selectedStatusBySupervisor ? 'ring-2 ring-primary shadow-md' : 'hover:bg-background hover:text-foreground'
                                )}
                              >
                                <ListFilter className="mr-2 h-3 w-3" />
                                Mostrar Todos los Estados
                              </Button>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-base font-medium text-foreground mb-3">Filtrar Facturas por Repartidor:</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                              {repartidores.map(repartidor => (
                                <Card
                                  key={repartidor.id}
                                  className={cn(
                                      "cursor-pointer transition-shadow",
                                      selectedRepartidorIdBySupervisor === repartidor.id ? 'ring-2 ring-primary shadow-md' : 'border hover:shadow-md'
                                  )}
                                  onClick={() => setSelectedRepartidorIdBySupervisor(prev => prev === repartidor.id ? ALL_REPARTIDORES_KEY : repartidor.id)}
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
                                  selectedRepartidorIdBySupervisor === UNASSIGNED_KEY ? 'ring-2 ring-primary shadow-md' : 'border hover:shadow-md'
                                )}
                                onClick={() => setSelectedRepartidorIdBySupervisor(prev => prev === UNASSIGNED_KEY ? ALL_REPARTIDORES_KEY : UNASSIGNED_KEY)}
                              >
                                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                                  <CardTitle className="text-xs font-medium">Facturas sin Asignar</CardTitle>
                                  <Archive className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="px-3 pb-2">
                                  <div className="text-xs text-muted-foreground">Ver no asignadas</div>
                                </CardContent>
                              </Card>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY)}
                                className={cn(
                                  "h-full whitespace-normal text-left justify-start items-center transition-shadow hover:shadow-md text-xs py-2 px-3",
                                   selectedRepartidorIdBySupervisor === ALL_REPARTIDORES_KEY ? 'ring-2 ring-primary shadow-md' : 'hover:bg-background hover:text-foreground'
                                )}
                              >
                                <Users className="mr-2 h-3 w-3" />
                                Mostrar Todas las Facturas
                              </Button>
                            </div>
                            {repartidores.length === 0 && (
                               <p className="text-muted-foreground mt-2 text-sm">No hay repartidores. Agrega uno para asignar facturas.</p>
                            )}
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
              {displayedInvoices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedInvoices.map(invoice => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      onAction={handleEditInvoiceClick}
                      currentUserRole={loggedInUser?.role}
                      assigneeName={getAssigneeName(invoice.assigneeId)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {searchTerm.trim() ? `No se encontraron facturas para "${searchTerm.trim()}" con los filtros seleccionados.` : `No se encontraron facturas que coincidan con los filtros seleccionados.`}
                </p>
              )}
            </div>
          </section>
        )}

        {loggedInUser.role === 'repartidor' && (
           <section>
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Mis Facturas Pendientes</h2>
            {displayedInvoices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedInvoices.map(invoice => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    onAction={handleProcessInvoiceClick}
                    currentUserRole={loggedInUser?.role}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No tienes facturas pendientes asignadas en este momento.</p>
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
        users={users}
        onSave={handleSaveInvoice}
      />

      {isSupervisor && !isAdmin && (
        <>
          <AddRepartidorDialog
            isOpen={isAddRepartidorDialogOpen}
            onOpenChange={setIsAddRepartidorDialogOpen}
            onSave={handleSaveRepartidor}
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
                onConfirm={executeDeleteRepartidor}
                confirmButtonText="Eliminar Repartidor"
            />
          )}
        </>
      )}

      {isAdmin && (
          <>
            <AddEditUserDialog
                isOpen={isAddEditUserDialogOpen}
                onOpenChange={setIsAddEditUserDialogOpen}
                userToEdit={userToEdit}
                onSave={handleSaveUser}
                availableRoles={manageableUserRoles} // Admin can create supervisors and repartidores
                currentUser={loggedInUser}
            />
            {userToDelete && (
                <ConfirmDialog
                    isOpen={isConfirmDeleteUserOpen}
                    onOpenChange={setIsConfirmDeleteUserOpen}
                    title={`Confirmar Eliminación de ${userToDelete.name}`}
                    description={`¿Estás seguro de que quieres eliminar a ${userToDelete.name} (${userToDelete.role})? Esta acción no se puede deshacer.${userToDelete.role === 'repartidor' ? ' Las facturas asignadas también se desasignarán.' : ''}`}
                    onConfirm={executeDeleteUser}
                    confirmButtonText="Eliminar Usuario"
                />
            )}
            <ManageAllUsersDialog
                isOpen={isManageAllUsersDialogOpen}
                onOpenChange={setIsManageAllUsersDialogOpen}
                allUsers={users}
                currentUser={loggedInUser}
                onEdit={handleOpenEditUserDialogFromMainPageOrModal}
                onDelete={handleOpenDeleteUserDialogFromMainPageOrModal}
            />
          </>
      )}
      <Toaster />
    </div>
  );
}
