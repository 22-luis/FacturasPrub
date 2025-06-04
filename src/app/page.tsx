
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { InvoiceCard } from '@/components/InvoiceCard';
import { ProcessInvoiceDialog } from '@/components/ProcessInvoiceDialog';
import { mockInvoices, mockUsers } from '@/lib/types';
import type { AssignedInvoice, User, UserRole } from '@/lib/types';
import { Toaster } from "@/components/ui/toaster";
import { UserSelector } from '@/components/UserSelector';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function HomePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<AssignedInvoice | null>(null);
  
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<AssignedInvoice[]>(mockInvoices);

  useEffect(() => {
    // Set a default user on initial load if none is selected
    if (!currentUser && users.length > 0) {
      setCurrentUser(users[0]);
    }
  }, [currentUser, users]);

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId) || null;
    setCurrentUser(user);
  };

  const handleProcessInvoice = (invoiceId: string) => {
    const invoiceToProcess = invoices.find(inv => inv.id === invoiceId);
    if (invoiceToProcess) {
      setSelectedInvoice(invoiceToProcess);
      setIsDialogOpen(true);
    }
  };

  const handleAddInvoiceClick = () => {
    // Placeholder for adding new invoice functionality
    alert("Funcionalidad 'Agregar Nueva Factura' aún no implementada.");
  };
  
  const getAssigneeName = (assigneeId?: string): string | undefined => {
    if (!assigneeId) return undefined;
    return users.find(u => u.id === assigneeId)?.name;
  };

  const displayedInvoices = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'supervisor') {
      return invoices;
    }
    if (currentUser.role === 'repartidor') {
      return invoices.filter(inv => inv.assigneeId === currentUser.id);
    }
    return [];
  }, [currentUser, invoices]);

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
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Panel de Supervisor - Todas las Facturas</h2>
              <Button onClick={handleAddInvoiceClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Nueva Factura
              </Button>
            </div>
            {displayedInvoices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedInvoices.map(invoice => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    onProcess={handleProcessInvoice}
                    currentUserRole={currentUser?.role}
                    assigneeName={getAssigneeName(invoice.assigneeId)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay facturas en el sistema.</p>
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
                    onProcess={handleProcessInvoice}
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
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        invoice={selectedInvoice}
      />
      <Toaster />
    </div>
  );
}
