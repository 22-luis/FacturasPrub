
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
import type { AssignedInvoice, User, InvoiceFormData, InvoiceStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { CancellationReasonDialog } from './CancellationReasonDialog';

// Define a type for the dialog's internal form state
type DialogFormState = Omit<InvoiceFormData, 'totalAmount'> & {
  totalAmount: string; // Keep as string for input flexibility
};

const initialDialogFormState: DialogFormState = {
  invoiceNumber: '',
  date: '',
  totalAmount: '', // Initialize as empty string
  supplierName: '',
  uniqueCode: '',
  address: '',
  assigneeId: undefined,
  status: 'PENDIENTE',
  cancellationReason: undefined,
};

const invoiceStatuses: InvoiceStatus[] = ['PENDIENTE', 'ENTREGADA', 'CANCELADA'];

interface AddEditInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceToEdit: AssignedInvoice | null;
  users: User[];
  onSave: (invoiceData: InvoiceFormData, id?: string) => void;
}

export function AddEditInvoiceDialog({
  isOpen,
  onOpenChange,
  invoiceToEdit,
  users,
  onSave,
}: AddEditInvoiceDialogProps) {
  const [formData, setFormData] = useState<DialogFormState>(initialDialogFormState);
  const { toast } = useToast();
  const [isCancellationReasonSubDialogOpen, setIsCancellationReasonSubDialogOpen] = useState(false);

  useEffect(() => {
    if (invoiceToEdit && isOpen) { // Ensure state updates only when dialog is open and has an invoice
      setFormData({
        invoiceNumber: invoiceToEdit.invoiceNumber,
        date: invoiceToEdit.date,
        totalAmount: invoiceToEdit.totalAmount.toString(), // Convert number to string
        supplierName: invoiceToEdit.supplierName,
        uniqueCode: invoiceToEdit.uniqueCode,
        address: invoiceToEdit.address || '',
        assigneeId: invoiceToEdit.assigneeId || undefined,
        status: invoiceToEdit.status || 'PENDIENTE',
        cancellationReason: invoiceToEdit.cancellationReason || undefined,
      });
    } else if (!invoiceToEdit && isOpen) { // Reset for new invoice when dialog opens
      setFormData(initialDialogFormState);
    }
  }, [invoiceToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
     if (name === "totalAmount") {
      // Allow only characters suitable for a decimal number string
      const regex = /^[0-9]*\.?[0-9]*$/;
      if (value === "" || regex.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: 'assigneeId' | 'status', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'assigneeId' 
        ? (value === 'unassigned' ? undefined : value)
        : (value as InvoiceStatus),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceNumber.trim() || 
        !formData.date.trim() || 
        !formData.supplierName.trim() || 
        !formData.uniqueCode.trim() ||
        !formData.address?.trim() ||
        !formData.totalAmount.trim() // Also check totalAmount string
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
      totalAmount: numericTotalAmount, // Convert back to number for saving
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
    if (isNaN(numericTotalAmount) || numericTotalAmount <=0) { // Basic validation for safety
        toast({ variant: "destructive", title: "Error", description: "Monto total inválido al confirmar cancelación."});
        setIsCancellationReasonSubDialogOpen(false);
        return;
    }

    const finalInvoiceData: InvoiceFormData = { 
        ...formData, 
        totalAmount: numericTotalAmount, // Convert to number
        status: 'CANCELADA' as InvoiceStatus, 
        cancellationReason: reason 
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
        if (!open) { // Reset form if dialog is closed externally
            setFormData(initialDialogFormState);
        }
        onOpenChange(open);
      }}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto">
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
                  value={formData.totalAmount} // This is now a string
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
                        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
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
                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                    {repartidores.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>
          <DialogFooter className="mt-auto pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => {
                 setFormData(initialDialogFormState); // Reset form on cancel
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
