
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { InvoiceCard } from '@/components/InvoiceCard';
import { ProcessInvoiceDialog } from '@/components/ProcessInvoiceDialog';
import { AddEditInvoiceDialog } from '@/components/AddEditInvoiceDialog';
import { AddRepartidorDialog } from '@/components/AddRepartidorDialog';
import { mockInvoices, mockUsers, generateInvoiceId, generateUserId } from '@/lib/types';
import type { AssignedInvoice, User, InvoiceFormData, InvoiceStatus } from '@/lib/types';
import { Toaster } from "@/components/ui/toaster";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, UserSquare2, Archive, UserPlus, LogIn, AlertTriangle, CheckCircle2, XCircle, ListFilter, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<AssignedInvoice | null>(null);

  const [isAddRepartidorDialogOpen, setIsAddRepartidorDialogOpen] = useState(false);

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [invoices, setInvoices] = useState<AssignedInvoice[]>(mockInvoices);
  const { toast } = useToast();

  const [selectedRepartidorIdBySupervisor, setSelectedRepartidorIdBySupervisor] = useState<string | null>(ALL_REPARTIDORES_KEY);
  const [selectedStatusBySupervisor, setSelectedStatusBySupervisor] = useState<InvoiceStatus | null>(null);


  useEffect(() => {
    if (!loggedInUser) {
      setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY); 
      setSelectedStatusBySupervisor(null);
    } else if (loggedInUser.role === 'supervisor') {
      setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY);
      setSelectedStatusBySupervisor(null);
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
    } else {
      toast({ variant: "destructive", title: "Error de Inicio de Sesión", description: "Nombre de usuario o contraseña incorrectos." });
    }
  };

  const handleLogout = () => {
    toast({ title: "Sesión Cerrada", description: `Hasta luego ${loggedInUser?.name}.` });
    setLoggedInUser(null);
    setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY);
    setSelectedStatusBySupervisor(null);
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
    setEditingInvoice(null); 
    setIsAddEditDialogOpen(true);
  };

  const handleEditInvoiceClick = (invoiceId: string) => {
    const invoiceToEdit = invoices.find(inv => inv.id === invoiceId);
    if (invoiceToEdit) {
      setEditingInvoice(invoiceToEdit);
      setIsAddEditDialogOpen(true);
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
    setIsAddEditDialogOpen(false); 
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

  const handleAddRepartidorClick = () => {
    setIsAddRepartidorDialogOpen(true);
  };

  const handleSaveRepartidor = (name: string) => {
    const newRepartidor: User = {
      id: generateUserId(),
      name,
      role: 'repartidor',
    };
    setUsers(prevUsers => [...prevUsers, newRepartidor]);
    toast({
      title: 'Repartidor Agregado',
      description: `El repartidor ${name} ha sido agregado al sistema.`,
    });
    setIsAddRepartidorDialogOpen(false);
  };
  
  const getAssigneeName = (assigneeId?: string): string | undefined => {
    if (!assigneeId) return undefined;
    return users.find(u => u.id === assigneeId)?.name;
  };

  const repartidores = useMemo(() => users.filter(user => user.role === 'repartidor'), [users]);

  const displayedInvoices = useMemo(() => {
    if (!loggedInUser) return [];

    if (loggedInUser.role === 'supervisor') {
      let filteredInvoices = [...invoices];

      if (selectedStatusBySupervisor) {
        filteredInvoices = filteredInvoices.filter(inv => inv.status === selectedStatusBySupervisor);
      }

      if (selectedRepartidorIdBySupervisor === UNASSIGNED_KEY) {
        filteredInvoices = filteredInvoices.filter(inv => !inv.assigneeId);
      } else if (selectedRepartidorIdBySupervisor && selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY) {
        filteredInvoices = filteredInvoices.filter(inv => inv.assigneeId === selectedRepartidorIdBySupervisor);
      }
      // If selectedRepartidorIdBySupervisor is ALL_REPARTIDORES_KEY, all repartidores/unassigned are included from the status-filtered list

      return filteredInvoices;
    }

    if (loggedInUser.role === 'repartidor') {
      return invoices.filter(inv => inv.assigneeId === loggedInUser.id && inv.status === 'PENDIENTE');
    }
    return [];
  }, [loggedInUser, invoices, selectedRepartidorIdBySupervisor, selectedStatusBySupervisor]);

  const getInvoicesTitleForSupervisor = () => {
    let statusPart = "Todas las Facturas";
    if (selectedStatusBySupervisor) {
      const statusDetail = statusCardDetails[selectedStatusBySupervisor];
      statusPart = statusDetail ? statusDetail.label : `Facturas ${selectedStatusBySupervisor.toLowerCase()}`;
    }

    let repartidorPart = "(Todos los Repartidores y Sin Asignar)";
    if (selectedRepartidorIdBySupervisor === UNASSIGNED_KEY) {
      repartidorPart = "(Sin Asignar)";
    } else if (selectedRepartidorIdBySupervisor && selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY) {
      const repartidor = users.find(u => u.id === selectedRepartidorIdBySupervisor);
      if (repartidor) {
        repartidorPart = `(Asignadas a: ${repartidor.name})`;
      }
    }
    return `${statusPart.charAt(0).toUpperCase() + statusPart.slice(1)} ${repartidorPart}`;
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
            <CardContent className="space-y-6">
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader loggedInUser={loggedInUser} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {loggedInUser.role === 'supervisor' && (
          <section className="space-y-8">
            <div>
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-semibold text-foreground">Panel de Supervisor</h2>
                <div className="flex gap-2">
                  <Button onClick={handleAddInvoiceClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Factura
                  </Button>
                  <Button onClick={handleAddRepartidorClick} variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Agregar Repartidor
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Filtrar por Estado:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {invoiceStatusesArray.map(status => {
                  const details = statusCardDetails[status];
                  return (
                    <Card
                      key={status}
                      className={cn(
                        "cursor-pointer hover:shadow-lg transition-shadow",
                        selectedStatusBySupervisor === status ? 'ring-2 ring-primary shadow-lg' : 'border'
                      )}
                      onClick={() => setSelectedStatusBySupervisor(status)}
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
                    "h-full whitespace-normal text-left transition-shadow hover:shadow-lg",
                    !selectedStatusBySupervisor ? 'ring-2 ring-primary shadow-lg' : 'hover:bg-background hover:text-foreground'
                  )}
                >
                  <ListFilter className="h-4 w-4" />
                  Mostrar Todos los Estados
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Filtrar por Repartidor:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {repartidores.map(repartidor => (
                  <Card 
                    key={repartidor.id} 
                    className={cn(
                        "cursor-pointer hover:shadow-lg transition-shadow",
                        selectedRepartidorIdBySupervisor === repartidor.id ? 'ring-2 ring-primary shadow-lg' : 'border'
                    )}
                    onClick={() => setSelectedRepartidorIdBySupervisor(repartidor.id)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{repartidor.name}</CardTitle>
                      <UserSquare2 className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">Rol: {repartidor.role}</div>
                    </CardContent>
                  </Card>
                ))}
                <Card
                  key={UNASSIGNED_KEY}
                  className={cn(
                    "cursor-pointer hover:shadow-lg transition-shadow",
                    selectedRepartidorIdBySupervisor === UNASSIGNED_KEY ? 'ring-2 ring-primary shadow-lg' : 'border'
                  )}
                  onClick={() => setSelectedRepartidorIdBySupervisor(UNASSIGNED_KEY)}
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
                    "h-full whitespace-normal text-left transition-shadow hover:shadow-lg",
                    selectedRepartidorIdBySupervisor === ALL_REPARTIDORES_KEY ? 'ring-2 ring-primary shadow-lg' : 'hover:bg-background hover:text-foreground'
                  )}
                >
                  <Users className="h-4 w-4" />
                  Mostrar Todas las Facturas
                </Button>
              </div>
              {repartidores.length === 0 && (
                 <p className="text-muted-foreground mt-2">No hay repartidores en el sistema. Agrega uno para asignar facturas.</p>
              )}
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground my-6">
                {getInvoicesTitleForSupervisor()}
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
                  No se encontraron facturas que coincidan con los filtros seleccionados.
                </p>
              )}
            </div>
          </section>
        )}

        {loggedInUser.role === 'repartidor' && (
           <section>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Mis Facturas Pendientes</h2>
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
        isOpen={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        invoiceToEdit={editingInvoice}
        users={users}
        onSave={handleSaveInvoice}
      />
      <AddRepartidorDialog
        isOpen={isAddRepartidorDialogOpen}
        onOpenChange={setIsAddRepartidorDialogOpen}
        onSave={handleSaveRepartidor}
      />
      <Toaster />
    </div>
  );
}

