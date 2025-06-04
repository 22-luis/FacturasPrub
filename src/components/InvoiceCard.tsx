
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Hash, Building, BadgeDollarSign, Fingerprint, PlayCircle, UserCircle, Eye } from 'lucide-react';
import type { AssignedInvoice, UserRole } from '@/lib/types';

interface InvoiceCardProps {
  invoice: AssignedInvoice;
  onProcess: (invoiceId: string) => void;
  currentUserRole?: UserRole;
  assigneeName?: string;
}

export function InvoiceCard({ invoice, onProcess, currentUserRole, assigneeName }: InvoiceCardProps) {
  const isSupervisor = currentUserRole === 'supervisor';
  const buttonText = isSupervisor ? 'Ver Detalles' : 'Procesar Factura';
  const ButtonIcon = isSupervisor ? Eye : PlayCircle;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-xl">
          <span>{invoice.supplierName}</span>
          <Fingerprint className="h-5 w-5 text-primary" />
        </CardTitle>
        <CardDescription>Código Único: {invoice.uniqueCode}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm flex-grow">
        <div className="flex items-center">
          <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-muted-foreground mr-1">Factura #:</span>
          <span className="font-medium text-foreground">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
           <span className="text-muted-foreground mr-1">Fecha:</span>
          <span className="font-medium text-foreground">{invoice.date}</span>
        </div>
        <div className="flex items-center">
          <BadgeDollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
           <span className="text-muted-foreground mr-1">Monto:</span>
          <span className="font-medium text-foreground">${invoice.totalAmount.toFixed(2)}</span>
        </div>
         <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
           <span className="text-muted-foreground mr-1">Proveedor:</span>
          <span className="font-medium text-foreground">{invoice.supplierName}</span>
        </div>
        {isSupervisor && (
          <div className="flex items-center pt-1">
            <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground mr-1">Asignada a:</span>
            <span className="font-medium text-foreground">{assigneeName || 'Sin asignar'}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={() => onProcess(invoice.id)} className="w-full" variant={isSupervisor ? "secondary" : "default"}>
          <ButtonIcon className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}
