
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Hash, Building, BadgeDollarSign, Fingerprint, PlayCircle, UserCircle, Edit3, MapPin, AlertCircle, CheckCircle, Ban, Briefcase, PackageSearch, PackageCheck, ShieldX, RotateCcw, PackageOpen, Package, MessageSquareText, FileWarning } from 'lucide-react';
import type { AssignedInvoice, UserRole, InvoiceStatus, IncidenceType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface InvoiceCardProps {
  invoice: AssignedInvoice;
  onAction?: (invoiceId: string) => void; 
  onUpdateStatus?: (
    invoiceId: string, 
    newStatus: InvoiceStatus, 
    cancellationReason?: string, 
    deliveryNotes?: string,
    incidencePayload?: {
        type: IncidenceType;
        details: string;
        reportedAt: string;
        requiresAction: boolean;
    } | {
        type: null;
        details: null;
        reportedAt: null;
        requiresAction: false;
    }
  ) => void;
  currentUserRole?: UserRole;
  assigneeName?: string;
  clientName?: string;
  repartidorNameForRoute?: string; 
}

const statusStyles: Record<InvoiceStatus, {
  Icon: React.ElementType;
  badgeClass: string;
  text: string;
}> = {
  PENDIENTE: { Icon: AlertCircle, badgeClass: 'bg-yellow-500 hover:bg-yellow-500/90 text-black', text: 'Pendiente' },
  EN_PREPARACION: { Icon: PackageSearch, badgeClass: 'bg-blue-500 hover:bg-blue-500/90 text-white', text: 'En Preparación' },
  LISTO_PARA_RUTA: { Icon: PackageCheck, badgeClass: 'bg-teal-500 hover:bg-teal-500/90 text-white', text: 'Listo para Ruta' },
  INCIDENCIA_BODEGA: { Icon: ShieldX, badgeClass: 'bg-orange-500 hover:bg-orange-500/90 text-white', text: 'Incidencia Bodega' },
  ENTREGADA: { Icon: CheckCircle, badgeClass: 'bg-green-500 hover:bg-green-500/90 text-white', text: 'Entregada' },
  CANCELADA: { Icon: Ban, badgeClass: 'bg-red-600 hover:bg-red-600/90 text-white', text: 'Cancelada' },
};

const incidenceTypeLabels: Record<NonNullable<IncidenceType>, string> = {
  REFACTURACION: "Refacturación",
  DEVOLUCION: "Devolución",
  NEGOCIACION: "Negociación",
};


export function InvoiceCard({ invoice, onAction, onUpdateStatus, currentUserRole, assigneeName, clientName, repartidorNameForRoute }: InvoiceCardProps) {
  const isSupervisor = currentUserRole === 'supervisor';
  const isAdmin = currentUserRole === 'administrador';
  const isRepartidor = currentUserRole === 'repartidor';
  const isBodega = currentUserRole === 'bodega';
  const isSupervisorOrAdmin = isSupervisor || isAdmin;
  
  let buttonText = 'Acción';
  let ButtonIcon = PlayCircle; 
  let buttonVariant: "default" | "secondary" | "outline" = "default";

  if (isSupervisorOrAdmin && onAction) {
    buttonText = 'Editar / Asignar';
    ButtonIcon = Edit3; 
    buttonVariant = "secondary";
  } else if (isRepartidor && onAction && invoice.status === 'LISTO_PARA_RUTA') { 
    buttonText = 'Procesar Entrega';
    ButtonIcon = PlayCircle;
    buttonVariant = "default";
  }

  const currentStatusStyle = statusStyles[invoice.status] || statusStyles.PENDIENTE;
  const displayTotalAmount = invoice.totalAmount != null ? Number(invoice.totalAmount).toFixed(2) : '0.00';
  const cardTitle = clientName || invoice.supplierName || "Factura";

  const handleBodegaAction = (newStatus: InvoiceStatus) => {
    if (onUpdateStatus) {
      onUpdateStatus(invoice.id, newStatus);
    }
  };

  return (
    <Card className={cn(
        "shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col",
        invoice.incidenceRequiresAction && (isSupervisorOrAdmin) && "border-2 border-amber-500 ring-2 ring-amber-500 ring-offset-2"
        )}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg sm:text-xl flex items-center">
            <span className="mr-2 break-words">{cardTitle}</span>
            <Fingerprint className="h-5 w-5 text-primary flex-shrink-0" />
          </CardTitle>
          <Badge className={cn("text-xs whitespace-nowrap", currentStatusStyle.badgeClass)}>
            <currentStatusStyle.Icon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            {currentStatusStyle.text}
          </Badge>
        </div>
         {invoice.incidenceRequiresAction && (isSupervisorOrAdmin) && (
            <Badge variant="destructive" className="mt-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white self-start">
                <FileWarning className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                INCIDENCIA REQUIERE ATENCIÓN
            </Badge>
        )}
        <CardDescription className="break-words pt-0.5">Código Único: {invoice.uniqueCode}</CardDescription>
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
        {(isSupervisorOrAdmin || isBodega) && assigneeName && ( 
          <div className="flex items-start pt-1">
            <UserCircle className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-muted-foreground mr-1">{isBodega ? 'Para Repartidor:' : 'Asignada a:'}</span>
              <span className="font-medium text-foreground break-words">{assigneeName || (isSupervisorOrAdmin ? 'Sin asignar' : 'N/A')}</span>
            </div>
          </div>
        )}
         {isBodega && repartidorNameForRoute && (
          <div className="flex items-start pt-1">
            <UserCircle className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-muted-foreground mr-1">Ruta de:</span>
              <span className="font-medium text-foreground break-words">{repartidorNameForRoute}</span>
            </div>
          </div>
        )}
        {invoice.cancellationReason && (
          <div className="flex items-start pt-1 text-destructive">
            <Ban className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-medium mr-1">Cancelada:</span>
              <span className="break-words">{invoice.cancellationReason}</span>
            </div>
          </div>
        )}
        {invoice.deliveryNotes && (
            <div className="flex items-start pt-1 text-muted-foreground">
                <MessageSquareText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/>
                <div className="min-w-0 flex-1">
                    <span className="font-medium mr-1">Notas Generales:</span>
                    <span className="break-words italic">{invoice.deliveryNotes}</span>
                </div>
            </div>
        )}
         {invoice.incidenceType && (
            <div className="flex items-start pt-1 text-amber-700">
                <FileWarning className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/>
                <div className="min-w-0 flex-1">
                    <span className="font-semibold mr-1">Incidencia ({incidenceTypeLabels[invoice.incidenceType] || invoice.incidenceType}):</span>
                    <span className="break-words italic">{invoice.incidenceDetails}</span>
                    {invoice.incidenceReportedAt && (
                        <span className="block text-xs mt-0.5 text-amber-600">Reportada: {new Date(invoice.incidenceReportedAt).toLocaleDateString()}</span>
                    )}
                </div>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2">
        {(isSupervisorOrAdmin || (isRepartidor && invoice.status === 'LISTO_PARA_RUTA')) && onAction && (
          <Button onClick={() => onAction(invoice.id)} className="w-full" variant={buttonVariant}>
            <ButtonIcon className="mr-2 h-4 w-4" />
            {buttonText}
          </Button>
        )}
        {isBodega && onUpdateStatus && (
          <>
            {invoice.status === 'PENDIENTE' && (
              <Button onClick={() => handleBodegaAction('EN_PREPARACION')} className="w-full" variant="outline">
                <PackageOpen className="mr-2 h-4 w-4" /> Iniciar Preparación
              </Button>
            )}
            {invoice.status === 'EN_PREPARACION' && (
              <Button onClick={() => handleBodegaAction('LISTO_PARA_RUTA')} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                <PackageCheck className="mr-2 h-4 w-4" /> Listo para Ruta
              </Button>
            )}
             {(invoice.status === 'LISTO_PARA_RUTA' || invoice.status === 'INCIDENCIA_BODEGA') && (
                <Button onClick={() => handleBodegaAction('EN_PREPARACION')} variant="outline" size="sm" className="w-full">
                    <RotateCcw className="mr-2 h-3 w-3" /> Revertir a En Preparación
                </Button>
            )}
            {invoice.status !== 'INCIDENCIA_BODEGA' && (
                 <Button onClick={() => handleBodegaAction('INCIDENCIA_BODEGA')} variant="destructive"className="w-full">
                    <ShieldX className="mr-2 h-4 w-4" /> Reportar Incidencia de Bodega
                </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}

