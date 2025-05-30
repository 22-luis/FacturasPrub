'use client'; // This page needs to be a client component to manage state for the dialog

import React, { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { InvoiceCard } from '@/components/InvoiceCard';
import { ProcessInvoiceDialog } from '@/components/ProcessInvoiceDialog';
import { mockAssignedInvoices } from '@/lib/types';
import type { AssignedInvoice } from '@/lib/types';
import { Toaster } from "@/components/ui/toaster";


export default function HomePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<AssignedInvoice | null>(null);

  const handleProcessInvoice = (invoiceId: string) => {
    const invoiceToProcess = mockAssignedInvoices.find(inv => inv.id === invoiceId);
    if (invoiceToProcess) {
      setSelectedInvoice(invoiceToProcess);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Assigned Invoices</h2>
          {mockAssignedInvoices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockAssignedInvoices.map(invoice => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onProcess={handleProcessInvoice}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No invoices assigned to you at the moment.</p>
          )}
        </section>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} SnapClaim. All rights reserved.
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
