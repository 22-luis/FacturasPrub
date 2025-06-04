
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { InvoiceCard } from '@/components/InvoiceCard';
import { ProcessInvoiceDialog } from '@/components/ProcessInvoiceDialog';
import { AddEditInvoiceDialog } from '@/components/AddEditInvoiceDialog';
import { mockInvoices, mockUsers, generateInvoiceId } from '@/lib/types';
import type { AssignedInvoice, User, InvoiceFormData, UserRole } from '@/lib/types';
import { Toaster } from "@/components/ui/toaster";
import { UserSelector } from '@/components/UserSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, UserSquare2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processingInvoice, setProcessingInvoice] = useState<AssignedInvoice | null>(null);
  
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<AssignedInvoice | null>(null);

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<AssignedInvoice[]>(mockInvoices);
  const { toast } = useToast();

  // State for supervisor to track which repartidor's invoices are being viewed
  const [selectedRepartidorIdBySupervisor, setSelectedRepartidorIdBySupervisor] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser && users.length > 0) {
      setCurrentUser(users[0]);
    }
  }, [currentUser, users]);

  useEffect(() => {
    // When currentUser changes, or if current user is not a supervisor, reset selected repartidor
    if (!currentUser || currentUser.role !== 'supervisor') {
      setSelectedRepartidorIdBySupervisor(null);
    }
  }, [currentUser]);

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId) || null;
    setCurrentUser(user);
    // If a new user is selected, reset the supervisor's selection of a repartidor
    setSelectedRepartidorIdBySupervisor(null); 
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
  
  const getAssigneeName = (assigneeId?: string): string | undefined => {
    if (!assigneeId) return undefined;
    return users.find(u => u.id === assigneeId)?.name;
  };

  const repartidores = useMemo(() => users.filter(user => user.role === 'repartidor'), [users]);

  const selectedRepartidorDetails = useMemo(() => {
    if (currentUser?.role === 'supervisor' && selectedRepartidorIdBySupervisor) {
      return users.find(u => u.id === selectedRepartidorIdBySupervisor);
    }
    return null;
  }, [currentUser, selectedRepartidorIdBySupervisor, users]);

  const displayedInvoices = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'supervisor') {
      if (selectedRepartidorIdBySupervisor) {
        return invoices.filter(inv => inv.assigneeId === selectedRepartidorIdBySupervisor);
      }
      return []; // No repartidor selected by supervisor, so no invoices to show
    }

    if (currentUser.role === 'repartidor') {
      return invoices.filter(inv => inv.assigneeId === currentUser.id);
    }
    return [];
  }, [currentUser, invoices, selectedRepartidorIdBySupervisor]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <UserSelector users={users} currentUser={currentUser} onSelectUser={handleUserSelect} className="mb-8" />

        {!currentUser && (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">Por favor, selecciona un usuario para continuar.</p>
          </div>
        )}

        {currentUser && currentUser.role === 'supervisor' && (
          <section className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-foreground">Panel de Supervisor</h2>
                <Button onClick={handleAddInvoiceClick}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Nueva Factura
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Repartidores</h3>
              {repartidores.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {repartidores.map(repartidor => (
                    <Card 
                      key={repartidor.id} 
                      className={`cursor-pointer hover:shadow-lg transition-shadow ${selectedRepartidorIdBySupervisor === repartidor.id ? 'ring-2 ring-primary shadow-lg' : ''}`}
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
                </div>
              ) : (
                <p className="text-muted-foreground">No hay repartidores en el sistema.</p>
              )}
            </div>
            
            {selectedRepartidorDetails && (
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Facturas asignadas a {selectedRepartidorDetails.name}
                </h3>
                {displayedInvoices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedInvoices.map(invoice => (
                      <InvoiceCard
                        key={invoice.id}
                        invoice={invoice}
                        onAction={handleEditInvoiceClick} 
                        currentUserRole={currentUser?.role}
                        assigneeName={getAssigneeName(invoice.assigneeId)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">{selectedRepartidorDetails.name} no tiene facturas asignadas.</p>
                )}
              </div>
            )}
             {!selectedRepartidorDetails && (
                <p className="text-muted-foreground pt-4">Selecciona un repartidor para ver sus facturas asignadas.</p>
             )}
          </section>
        )}

        {currentUser && currentUser.role === 'repartidor' && (
           <section>
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Mis Facturas Asignadas</h2>
            {displayedInvoices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedInvoices.map(invoice => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    onAction={handleProcessInvoiceClick} 
                    currentUserRole={currentUser?.role}
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
      />
      <AddEditInvoiceDialog
        isOpen={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        invoiceToEdit={editingInvoice}
        users={users}
        onSave={handleSaveInvoice}
      />
      <Toaster />
    </div>
  );
}

