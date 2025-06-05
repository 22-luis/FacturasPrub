
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link'; // Import Link
import { AppHeader } from '@/components/AppHeader';
import { InvoiceCard } from '@/components/InvoiceCard';
import { ProcessInvoiceDialog } from '@/components/ProcessInvoiceDialog';
import { AddEditInvoiceDialog } from '@/components/AddEditInvoiceDialog';
import { AddRepartidorDialog } from '@/components/AddRepartidorDialog';
import { ManageRepartidoresDialog } from '@/components/ManageRepartidoresDialog';
// AddEditUserDialog and ConfirmDialog for user deletion will be primarily used in the new admin/manage-users page
// but ConfirmDialog might still be needed for repartidor deletion here.
import { ConfirmDialog } from '@/components/ConfirmDialog'; 

import { mockInvoices, mockUsers, generateInvoiceId, generateUserId } from '@/lib/types';
import type { AssignedInvoice, User, InvoiceFormData, InvoiceStatus, UserRole } from '@/lib/types';
import { Toaster } from "@/components/ui/toaster";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, UserSquare2, Archive, UserPlus, LogIn, AlertTriangle, CheckCircle2, XCircle, ListFilter, Users, Search, Filter, Settings2, Users2 as UsersIconLucide } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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


export default function HomePage() {
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processingInvoice, setProcessingInvoice] = useState<AssignedInvoice | null>(null);

  const [isAddEditInvoiceDialogOpen, setIsAddEditInvoiceDialogOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<AssignedInvoice | null>(null);

  // For Supervisor role (managing repartidores)
  const [isAddRepartidorDialogOpen, setIsAddRepartidorDialogOpen] = useState(false);
  const [repartidorToEditFromSupervisor, setRepartidorToEditFromSupervisor] = useState<User | null>(null);
  const [isManageRepartidoresOpen, setIsManageRepartidoresOpen] = useState(false);
  const [isConfirmDeleteRepartidorOpen, setIsConfirmDeleteRepartidorOpen] = useState(false);
  const [repartidorToDelete, setRepartidorToDelete] = useState<User | null>(null);

  // User state will primarily be managed by the new admin page for admins.
  // Supervisors will manage repartidores through their specific dialogs.
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
    } else if (loggedInUser.role === 'supervisor' || loggedInUser.role === 'administrador') {
      // For supervisor/admin, reset filters on login
    }
  }, [loggedInUser]);

  const handleLogin = () => {
    if (!usernameInput.trim() || !passwordInput) {
      toast({ variant: "destructive", title: "Error", description: "Por favor, ingresa tu nombre de usuario y contraseña." });
      return;
    }
    const user = users.find(u => u.name.toLowerCase() === usernameInput.trim().toLowerCase());

    if (user && passwordInput === '123') {
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

  // --- Repartidor Management (for Supervisor role) ---
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

  // --- All User Management (for Administrador role) will now be on a separate page ---

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
      return filteredInvoices;
    }

    if (loggedInUser.role === 'repartidor') {
      return invoices.filter(inv => inv.assigneeId === loggedInUser.id && inv.status === 'PENDIENTE');
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
                    placeholder="Ej: Ana Supervisora"
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
                  {isSupervisor && ( // Only supervisor will see these specific buttons now
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
                    <Link href="/admin/manage-users" passHref>
                      <Button variant="outline">
                        <UsersIconLucide className="mr-2 h-4 w-4" />
                        Gestionar Usuarios del Sistema
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <Accordion type="single" collapsible className="w-full mb-6 border rounded-md shadow-sm">
                <AccordionItem value="filters-search">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-base font-medium">
                      <Filter className="h-5 w-5 text-primary" />
                      <span>Opciones de Filtrado y Búsqueda de Facturas</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 px-4 space-y-6">
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
                      <h3 className="text-lg font-medium text-foreground mb-4">Filtrar Facturas por Estado:</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {invoiceStatusesArray.map(status => {
                          const details = statusCardDetails[status];
                          return (
                            <Card
                              key={status}
                              className={cn(
                                "cursor-pointer transition-shadow",
                                selectedStatusBySupervisor === status ? 'ring-2 ring-primary shadow-lg' : 'border hover:shadow-lg'
                              )}
                              onClick={() => setSelectedStatusBySupervisor(prev => prev === status ? null : status)}
                            >
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{details.label}</CardTitle>
                                <details.Icon className="h-5 w-5 text-muted-foreground" />
                              </CardHeader>
                              <CardContent>
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
                            "h-full whitespace-normal text-left justify-start items-center transition-shadow hover:shadow-lg",
                            !selectedStatusBySupervisor ? 'ring-2 ring-primary shadow-lg' : 'hover:bg-background hover:text-foreground'
                          )}
                        >
                          <ListFilter className="mr-2 h-4 w-4" />
                          Mostrar Todos los Estados
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-4">Filtrar Facturas por Repartidor:</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {repartidores.map(repartidor => (
                          <Card
                            key={repartidor.id}
                            className={cn(
                                "cursor-pointer transition-shadow",
                                selectedRepartidorIdBySupervisor === repartidor.id ? 'ring-2 ring-primary shadow-lg' : 'border hover:shadow-lg'
                            )}
                            onClick={() => setSelectedRepartidorIdBySupervisor(prev => prev === repartidor.id ? ALL_REPARTIDORES_KEY : repartidor.id)}
                          >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">{repartidor.name}</CardTitle>
                              <UserSquare2 className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-xs text-muted-foreground">Rol: repartidor</div>
                            </CardContent>
                          </Card>
                        ))}
                        <Card
                          key={UNASSIGNED_KEY}
                          className={cn(
                            "cursor-pointer transition-shadow",
                            selectedRepartidorIdBySupervisor === UNASSIGNED_KEY ? 'ring-2 ring-primary shadow-lg' : 'border hover:shadow-lg'
                          )}
                          onClick={() => setSelectedRepartidorIdBySupervisor(prev => prev === UNASSIGNED_KEY ? ALL_REPARTIDORES_KEY : UNASSIGNED_KEY)}
                        >
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Facturas sin Asignar</CardTitle>
                            <Archive className="h-5 w-5 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-xs text-muted-foreground">Ver facturas no asignadas</div>
                          </CardContent>
                        </Card>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY)}
                          className={cn(
                            "h-full whitespace-normal text-left justify-start items-center transition-shadow hover:shadow-lg",
                             selectedRepartidorIdBySupervisor === ALL_REPARTIDORES_KEY ? 'ring-2 ring-primary shadow-lg' : 'hover:bg-background hover:text-foreground'
                          )}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Mostrar Todas las Facturas
                        </Button>
                      </div>
                      {repartidores.length === 0 && (
                         <p className="text-muted-foreground mt-2">No hay repartidores en el sistema. Agrega uno para asignar facturas.</p>
                      )}
                    </div>
                  </AccordionContent>
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

        {/* Admin User Management Section has been moved to /admin/manage-users */}

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
        users={users} // This dialog is still used by Supervisor/Admin for invoices
        onSave={handleSaveInvoice}
      />
      {/* Dialogs for Supervisor role */}
      {isSupervisor && ( 
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
      {/* Dialogs for Administrador role (user add/edit and delete confirmation) are now mainly on /admin/manage-users page */}
      {/* However, ConfirmDialog for deleting repartidor might still be triggered by a supervisor. */}
      <Toaster />
    </div>
  );
}
