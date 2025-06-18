
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Hash, Building, BadgeDollarSign, Fingerprint, PlayCircle, UserCircle, Edit3, MapPin, AlertCircle, CheckCircle, Ban, Briefcase } from 'lucide-react';
import type { AssignedInvoice, UserRole, InvoiceStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface InvoiceCardProps {
  invoice: AssignedInvoice;
  onAction: (invoiceId: string) => void; 
  currentUserRole?: UserRole;
  assigneeName?: string;
  clientName?: string;
}

const statusStyles: Record<InvoiceStatus, {
  Icon: React.ElementType;
  badgeClass: string;
  text: string;
}> = {
  PENDIENTE: { Icon: AlertCircle, badgeClass: 'bg-yellow-500 hover:bg-yellow-500/90 text-black', text: 'Pendiente' },
  ENTREGADA: { Icon: CheckCircle, badgeClass: 'bg-green-500 hover:bg-green-500/90 text-white', text: 'Entregada' },
  CANCELADA: { Icon: Ban, badgeClass: 'bg-red-600 hover:bg-red-600/90 text-white', text: 'Cancelada' },
};


export function InvoiceCard({ invoice, onAction, currentUserRole, assigneeName, clientName }: InvoiceCardProps) {
  const isSupervisor = currentUserRole === 'supervisor';
  const isAdmin = currentUserRole === 'administrador';
  const isSupervisorOrAdmin = isSupervisor || isAdmin;
  
  let buttonText = 'Acción';
  let ButtonIcon = PlayCircle; 
  let buttonVariant: "default" | "secondary" = "default";

  if (isSupervisorOrAdmin) {
    buttonText = 'Editar / Asignar';
    ButtonIcon = Edit3; 
    buttonVariant = "secondary";
  } else { 
    buttonText = 'Procesar Factura';
    ButtonIcon = PlayCircle;
    buttonVariant = "default";
  }

  const currentStatusStyle = statusStyles[invoice.status] || statusStyles.PENDIENTE;
  const displayTotalAmount = invoice.totalAmount != null ? Number(invoice.totalAmount).toFixed(2) : '0.00';
  const cardTitle = clientName || invoice.supplierName || "Factura";

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl flex items-center">
            <span className="mr-2 break-words">{cardTitle}</span>
            <Fingerprint className="h-5 w-5 text-primary flex-shrink-0" />
          </CardTitle>
          <Badge className={cn("text-xs whitespace-nowrap", currentStatusStyle.badgeClass)}>
            <currentStatusStyle.Icon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            {currentStatusStyle.text}
          </Badge>
        </div>
        <CardDescription className="break-words">Código Único: {invoice.uniqueCode}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm flex-grow">
        <div className="flex items-start">
          <Hash className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-muted-foreground mr-1">Factura #:</span>
            <span className="font-medium text-foreground break-words">{invoice.invoiceNumber}</span>
          </div>
        </div>
        <div className="flex items-start">
          <CalendarDays className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
           <span className="text-muted-foreground mr-1">Fecha:</span>
            <span className="font-medium text-foreground break-words">{invoice.date}</span>
          </div>
        </div>
        <div className="flex items-start">
          <BadgeDollarSign className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
           <span className="text-muted-foreground mr-1">Monto:</span>
            <span className="font-medium text-foreground break-words">${displayTotalAmount}</span>
          </div>
        </div>
         <div className="flex items-start">
          <Building className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
           <span className="text-muted-foreground mr-1">Proveedor:</span>
            <span className="font-medium text-foreground break-words">{invoice.supplierName}</span>
          </div>
        </div>
        {invoice.address && (
          <div className="flex items-start">
            <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-muted-foreground mr-1">Dirección:</span>
              <span className="font-medium text-foreground break-words">{invoice.address}</span>
            </div>
          </div>
        )}
        {clientName && (
          <div className="flex items-start pt-1">
            <Briefcase className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-muted-foreground mr-1">Cliente:</span>
              <span className="font-medium text-foreground break-words">{clientName}</span>
            </div>
          </div>
        )}
        {isSupervisorOrAdmin && (
          <div className="flex items-start pt-1">
            <UserCircle className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-muted-foreground mr-1">Asignada a:</span>
              <span className="font-medium text-foreground break-words">{assigneeName || 'Sin asignar'}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={() => onAction(invoice.id)} className="w-full" variant={buttonVariant}>
          <ButtonIcon className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}
