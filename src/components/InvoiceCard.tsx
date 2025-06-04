
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Hash, Building, BadgeDollarSign, Fingerprint, PlayCircle, UserCircle, Edit3, MapPin, AlertCircle, CheckCircle, Ban } from 'lucide-react';
import type { AssignedInvoice, UserRole, InvoiceStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface InvoiceCardProps {
  invoice: AssignedInvoice;
  onAction: (invoiceId: string) => void; 
  currentUserRole?: UserRole;
  assigneeName?: string;
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


export function InvoiceCard({ invoice, onAction, currentUserRole, assigneeName }: InvoiceCardProps) {
  const isSupervisor = currentUserRole === 'supervisor';
  
  let buttonText = 'Acción';
  let ButtonIcon = PlayCircle; 
  let buttonVariant: "default" | "secondary" = "default";

  if (isSupervisor) {
    buttonText = 'Editar / Asignar';
    ButtonIcon = Edit3; 
    buttonVariant = "secondary";
  } else { 
    buttonText = 'Procesar Factura';
    ButtonIcon = PlayCircle;
    buttonVariant = "default";
  }

  const currentStatusStyle = statusStyles[invoice.status] || statusStyles.PENDIENTE;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center">
            <span className="mr-2">{invoice.supplierName}</span>
            <Fingerprint className="h-5 w-5 text-primary" />
          </CardTitle>
          <Badge className={cn("text-xs", currentStatusStyle.badgeClass)}>
            <currentStatusStyle.Icon className="h-3.5 w-3.5 mr-1.5" />
            {currentStatusStyle.text}
          </Badge>
        </div>
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
        {invoice.address && (
          <div className="flex items-start">
            <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <span className="text-muted-foreground mr-1">Dirección:</span>
              <span className="font-medium text-foreground">{invoice.address}</span>
            </div>
          </div>
        )}
        {isSupervisor && (
          <div className="flex items-center pt-1">
            <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground mr-1">Asignada a:</span>
            <span className="font-medium text-foreground">{assigneeName || 'Sin asignar'}</span>
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
