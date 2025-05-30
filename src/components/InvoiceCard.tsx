import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Hash, Building, BadgeDollarSign, Fingerprint, PlayCircle } from 'lucide-react';
import type { AssignedInvoice } from '@/lib/types';

interface InvoiceCardProps {
  invoice: AssignedInvoice;
  onProcess: (invoiceId: string) => void;
}

export function InvoiceCard({ invoice, onProcess }: InvoiceCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl">
          <span>{invoice.supplierName}</span>
          <Fingerprint className="h-5 w-5 text-primary" />
        </CardTitle>
        <CardDescription>Unique Code: {invoice.uniqueCode}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center">
          <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-muted-foreground mr-1">Invoice #:</span>
          <span className="font-medium text-foreground">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
           <span className="text-muted-foreground mr-1">Date:</span>
          <span className="font-medium text-foreground">{invoice.date}</span>
        </div>
        <div className="flex items-center">
          <BadgeDollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
           <span className="text-muted-foreground mr-1">Amount:</span>
          <span className="font-medium text-foreground">${invoice.totalAmount.toFixed(2)}</span>
        </div>
         <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
           <span className="text-muted-foreground mr-1">Supplier:</span>
          <span className="font-medium text-foreground">{invoice.supplierName}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onProcess(invoice.id)} className="w-full" variant="default">
          <PlayCircle className="mr-2 h-4 w-4" />
          Process Invoice
        </Button>
      </CardFooter>
    </Card>
  );
}
