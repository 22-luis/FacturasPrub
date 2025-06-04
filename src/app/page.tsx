
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
import { PlusCircle, UserSquare2, Archive, UserPlus, LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UNASSIGNED_KEY = "unassigned_invoices_key";

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

  const [selectedRepartidorIdBySupervisor, setSelectedRepartidorIdBySupervisor] = useState<string | null>(null);

  useEffect(() => {
    if (!loggedInUser) {
      setSelectedRepartidorIdBySupervisor(null); 
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
    setSelectedRepartidorIdBySupervisor(null);
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
        // status is already part of invoiceData from initialFormState
      };
      setInvoices(prevInvoices => [newInvoice, ...prevInvoices]);
      toast({ title: "Factura Agregada", description: `La nueva factura #${newInvoice.invoiceNumber} ha sido agregada.` });
    }
    setIsAddEditDialogOpen(false); 
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, newStatus: InvoiceStatus) => {
    setInvoices(prevInvoices =>
      prevInvoices.map(inv =>
        inv.id === invoiceId ? { ...inv, status: newStatus } : inv
      )
    );
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

  const selectedRepartidorDetails = useMemo(() => {
    if (loggedInUser?.role === 'supervisor' && selectedRepartidorIdBySupervisor && selectedRepartidorIdBySupervisor !== UNASSIGNED_KEY) {
      return users.find(u => u.id === selectedRepartidorIdBySupervisor);
    }
    return null;
  }, [loggedInUser, selectedRepartidorIdBySupervisor, users]);

  const displayedInvoices = useMemo(() => {
    if (!loggedInUser) return [];

    if (loggedInUser.role === 'supervisor') {
      if (selectedRepartidorIdBySupervisor === UNASSIGNED_KEY) {
        return invoices.filter(inv => !inv.assigneeId);
      }
      if (selectedRepartidorIdBySupervisor) {
        return invoices.filter(inv => inv.assigneeId === selectedRepartidorIdBySupervisor);
      }
      return []; 
    }

    if (loggedInUser.role === 'repartidor') {
      return invoices.filter(inv => inv.assigneeId === loggedInUser.id);
    }
    return [];
  }, [loggedInUser, invoices, selectedRepartidorIdBySupervisor]);

  const getInvoicesTitleForSupervisor = () => {
    if (selectedRepartidorDetails) {
      return `Facturas asignadas a ${selectedRepartidorDetails.name}`;
    }
    if (selectedRepartidorIdBySupervisor === UNASSIGNED_KEY) {
      return "Facturas sin Asignar";
    }
    return "";
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
                  <Label htmlFor="username" className="mb-2 block text-sm font-medium text-foreground">
                    Nombre de Usuario:
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Ej: Ana Supervisora"
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                    Contraseña:
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Contraseña"
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
              <h3 className="text-xl font-semibold text-foreground mb-4">Ver Facturas Por:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {repartidores.map(repartidor => (
                  <Card 
                    key={repartidor.id} 
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${selectedRepartidorIdBySupervisor === repartidor.id ? 'ring-2 ring-primary shadow-lg' : 'border'}`}
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
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${selectedRepartidorIdBySupervisor === UNASSIGNED_KEY ? 'ring-2 ring-primary shadow-lg' : 'border'}`}
                  onClick={() => setSelectedRepartidorIdBySupervisor(UNASSIGNED_KEY)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Facturas sin Asignar</CardTitle>
                    <Archive className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">Ver todas las facturas no asignadas</div>
                  </CardContent>
                </Card>
              </div>
              {repartidores.length === 0 && (
                 <p className="text-muted-foreground mt-2">No hay repartidores en el sistema para asignar facturas.</p>
              )}
            </div>
            
            {selectedRepartidorIdBySupervisor && (
              <div>
                <h3 className="text-xl font-semibold text-foreground my-4">
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
                    {selectedRepartidorIdBySupervisor === UNASSIGNED_KEY 
                      ? "No hay facturas sin asignar." 
                      : `${selectedRepartidorDetails?.name || 'El repartidor seleccionado'} no tiene facturas asignadas.`}
                  </p>
                )}
              </div>
            )}
             {!selectedRepartidorIdBySupervisor && (
                <p className="text-muted-foreground pt-4">Selecciona un repartidor o "Facturas sin Asignar" para ver las facturas.</p>
             )}
          </section>
        )}

        {loggedInUser.role === 'repartidor' && (
           <section>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Mis Facturas Asignadas</h2>
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
              <p className="text-muted-foreground">No tienes facturas asignadas en este momento.</p>
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
