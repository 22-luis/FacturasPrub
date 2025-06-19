
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AssignedInvoice, User, InvoiceFormData, InvoiceStatus, Client, Route } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { CancellationReasonDialog } from './CancellationReasonDialog';
import { formatISO, parseISO, isSameDay } from 'date-fns';

type DialogFormState = Omit<InvoiceFormData, 'totalAmount'> & {
  totalAmount: string; 
};

const initialDialogFormState: DialogFormState = {
  invoiceNumber: '',
  date: '',
  totalAmount: '', 
  supplierName: '',
  uniqueCode: '',
  address: '',
  assigneeId: undefined,
  clientId: undefined,
  routeId: undefined,
  status: 'PENDIENTE',
  cancellationReason: undefined,
};

const invoiceStatuses: InvoiceStatus[] = ['PENDIENTE', 'EN_PREPARACION', 'LISTO_PARA_RUTA', 'ENTREGADA', 'CANCELADA', 'INCIDENCIA_BODEGA'];

interface AddEditInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceToEdit: AssignedInvoice | null;
  users: User[];
  clients: Client[]; 
  onSave: (invoiceData: InvoiceFormData, id?: string) => void;
  allRoutes: Route[];
}

export function AddEditInvoiceDialog({
  isOpen,
  onOpenChange,
  invoiceToEdit,
  users,
  clients,
  onSave,
  allRoutes,
}: AddEditInvoiceDialogProps) {
  const [formData, setFormData] = useState<DialogFormState>(initialDialogFormState);
  const { toast } = useToast();
  const [isCancellationReasonSubDialogOpen, setIsCancellationReasonSubDialogOpen] = useState(false);
  const [availableRoutesForDateAndAssignee, setAvailableRoutesForDateAndAssignee] = useState<Route[]>([]);

  useEffect(() => {
    if (invoiceToEdit && isOpen) { 
      setFormData({
        invoiceNumber: invoiceToEdit.invoiceNumber,
        date: invoiceToEdit.date,
        totalAmount: invoiceToEdit.totalAmount.toString(), 
        supplierName: invoiceToEdit.supplierName,
        uniqueCode: invoiceToEdit.uniqueCode,
        address: invoiceToEdit.address || '',
        assigneeId: invoiceToEdit.assigneeId || undefined,
        clientId: invoiceToEdit.clientId || undefined,
        routeId: invoiceToEdit.routeId || undefined,
        status: invoiceToEdit.status || 'PENDIENTE',
        cancellationReason: invoiceToEdit.cancellationReason || undefined,
      });
    } else if (!invoiceToEdit && isOpen) { 
      setFormData(initialDialogFormState);
    }
  }, [invoiceToEdit, isOpen]);


  useEffect(() => {
    if (formData.date && formData.assigneeId && allRoutes.length > 0) {
      const selectedDate = parseISO(formData.date);
      const filtered = allRoutes.filter(route => 
        isSameDay(parseISO(route.date), selectedDate) && route.repartidorId === formData.assigneeId
      );
      setAvailableRoutesForDateAndAssignee(filtered);
    } else {
      setAvailableRoutesForDateAndAssignee([]);
    }
     // If assignee or date changes, and a route was selected, but it's no longer valid, deselect it.
    if (formData.routeId && !availableRoutesForDateAndAssignee.find(r => r.id === formData.routeId)) {
        setFormData(prev => ({ ...prev, routeId: undefined }));
    }
  }, [formData.date, formData.assigneeId, allRoutes, formData.routeId]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
     if (name === "totalAmount") {
      const regex = /^[0-9]*\.?[0-9]*$/;
      if (value === "" || regex.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: 'assigneeId' | 'status' | 'clientId' | 'routeId', value: string) => {
     setFormData((prev) => ({
      ...prev,
      [name]: (name === 'assigneeId' || name === 'clientId' || name === 'routeId')
        ? (value === 'unassigned' ? undefined : value)
        : (value as InvoiceStatus),
    }));

    // If assigneeId changes, reset routeId because routes are assignee-specific
    if (name === 'assigneeId' || name === 'date') {
        setFormData(prev => ({ ...prev, routeId: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceNumber.trim() || 
        !formData.date.trim() || 
        !formData.supplierName.trim() || 
        !formData.uniqueCode.trim() ||
        !formData.address?.trim() ||
        !formData.totalAmount.trim() 
       ) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "Por favor, completa todos los campos obligatorios: Número de Factura, Fecha, Proveedor, Código Único, Dirección y Monto Total.",
      });
      return;
    }

    const numericTotalAmount = parseFloat(formData.totalAmount);
    if (isNaN(numericTotalAmount) || numericTotalAmount <= 0) {
       toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "El monto total debe ser un número positivo válido.",
      });
      return;
    }

    const dataToSave: InvoiceFormData = {
      ...formData,
      totalAmount: numericTotalAmount, 
      routeId: formData.routeId || null,
    };

    if (dataToSave.status === 'CANCELADA' && (!invoiceToEdit || invoiceToEdit.status !== 'CANCELADA')) {
      setIsCancellationReasonSubDialogOpen(true);
    } else {
      const finalDataToSave: InvoiceFormData = {
        ...dataToSave,
        cancellationReason: dataToSave.status === 'CANCELADA' ? dataToSave.cancellationReason : undefined,
      };
      onSave(finalDataToSave, invoiceToEdit?.id);
      onOpenChange(false);
    }
  };

  const handleConfirmCancellationWithReason = (reason?: string) => {
    const numericTotalAmount = parseFloat(formData.totalAmount);
    if (isNaN(numericTotalAmount) || numericTotalAmount <=0) { 
        toast({ variant: "destructive", title: "Error", description: "Monto total inválido al confirmar cancelación."});
        setIsCancellationReasonSubDialogOpen(false);
        return;
    }

    const finalInvoiceData: InvoiceFormData = { 
        ...formData, 
        totalAmount: numericTotalAmount, 
        status: 'CANCELADA' as InvoiceStatus, 
        cancellationReason: reason,
        routeId: formData.routeId || null, 
    };
    onSave(finalInvoiceData, invoiceToEdit?.id);
    setIsCancellationReasonSubDialogOpen(false);
    onOpenChange(false);
  };

  const repartidores = users.filter(user => user.role === 'repartidor');
  const dialogTitle = invoiceToEdit ? 'Editar Factura' : 'Agregar Nueva Factura';
  const dialogDescription = invoiceToEdit 
    ? `Modifica los detalles de la factura ${invoiceToEdit.invoiceNumber}.`
    : "Completa los detalles de la nueva factura.";

  return (
    <>
      <Dialog open={isOpen && !isCancellationReasonSubDialogOpen} onOpenChange={(open) => {
        if (!open) { 
            setFormData(initialDialogFormState);
            setAvailableRoutesForDateAndAssignee([]);
        }
        onOpenChange(open);
      }}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="invoiceNumber">Número de Factura</Label>
                <Input
                  id="invoiceNumber"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Fecha (YYYY-MM-DD)</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="totalAmount">Monto Total</Label>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="text"
                  inputMode="decimal"
                  value={formData.totalAmount} 
                  onChange={handleChange}
                  placeholder="Ej: 123.45"
                  required
                />
              </div>
              <div>
                <Label htmlFor="supplierName">Nombre del Proveedor</Label>
                <Input
                  id="supplierName"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="uniqueCode">Código Único</Label>
                <Input
                  id="uniqueCode"
                  name="uniqueCode"
                  value={formData.uniqueCode}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  placeholder="Ej: Calle Falsa 123, Ciudad"
                  rows={3}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="clientId">Cliente</Label>
                <Select
                  name="clientId"
                  value={formData.clientId || 'unassigned'}
                  onValueChange={(value) => handleSelectChange('clientId', value)}
                >
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Seleccionar cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin asignar cliente</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Estado de la Factura</Label>
                <Select
                  name="status"
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Seleccionar estado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.status === 'CANCELADA' && formData.cancellationReason && (
                <div className="text-sm text-muted-foreground p-2 border rounded-md">
                  <p><span className="font-medium">Motivo de cancelación guardado:</span> {formData.cancellationReason}</p>
                </div>
              )}
              <div>
                <Label htmlFor="assigneeId">Asignar a Repartidor</Label>
                <Select
                  name="assigneeId"
                  value={formData.assigneeId || 'unassigned'}
                  onValueChange={(value) => handleSelectChange('assigneeId', value)}
                >
                  <SelectTrigger id="assigneeId">
                    <SelectValue placeholder="Seleccionar repartidor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin asignar repartidor</SelectItem>
                    {repartidores.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="routeId">Asignar a Ruta (Opcional)</Label>
                <Select
                  name="routeId"
                  value={formData.routeId || 'unassigned'}
                  onValueChange={(value) => handleSelectChange('routeId', value)}
                  disabled={!formData.date || !formData.assigneeId || availableRoutesForDateAndAssignee.length === 0}
                >
                  <SelectTrigger id="routeId">
                    <SelectValue placeholder={
                      !formData.date || !formData.assigneeId 
                        ? "Selecciona fecha y repartidor primero" 
                        : availableRoutesForDateAndAssignee.length === 0 
                        ? "No hay rutas para esta fecha/repartidor"
                        : "Seleccionar ruta..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin asignar a ruta específica</SelectItem>
                    {availableRoutesForDateAndAssignee.map(route => (
                      <SelectItem key={route.id} value={route.id}>
                        Ruta de {route.repartidorName || 'Repartidor'} - {formatISO(parseISO(route.date), { representation: 'date' })} (ID: ...{route.id.slice(-4)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {(!formData.date || !formData.assigneeId) && <p className="text-xs text-muted-foreground mt-1">Para asignar una ruta, primero selecciona una fecha y un repartidor.</p>}
                 {(formData.date && formData.assigneeId && availableRoutesForDateAndAssignee.length === 0) && <p className="text-xs text-muted-foreground mt-1">No hay rutas creadas para el repartidor y fecha seleccionados.</p>}
              </div>
            </form>
          </div>
          <DialogFooter className="mt-auto pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => {
                 setFormData(initialDialogFormState);
                 setAvailableRoutesForDateAndAssignee([]);
                 onOpenChange(false);
              }}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmit}>Guardar Factura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(isOpen && ((formData.status as InvoiceStatus) === 'CANCELADA' || (invoiceToEdit && invoiceToEdit.status === 'CANCELADA' && (formData.status as InvoiceStatus) === 'CANCELADA'))) && (
        <CancellationReasonDialog
          isOpen={isCancellationReasonSubDialogOpen}
          onOpenChange={setIsCancellationReasonSubDialogOpen}
          invoiceIdentifier={formData.invoiceNumber || invoiceToEdit?.invoiceNumber || "Nueva Factura"}
          onConfirm={handleConfirmCancellationWithReason}
        />
      )}
    </>
  );
}
