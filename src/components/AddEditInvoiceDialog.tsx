
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
import { CancellationReasonDialog } from './CancellationReasonDialog'; // Import new dialog

interface AddEditInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceToEdit?: AssignedInvoice | null;
  users: User[];
  onSave: (invoiceData: InvoiceFormData, id?: string) => void;
}

const initialFormState: InvoiceFormData = {
  invoiceNumber: '',
  date: '',
  totalAmount: 0,
  supplierName: '',
  uniqueCode: '',
  address: '',
  assigneeId: undefined,
  status: 'PENDIENTE',
  cancellationReason: undefined,
};

const invoiceStatuses: InvoiceStatus[] = ['PENDIENTE', 'ENTREGADA', 'CANCELADA'];

export function AddEditInvoiceDialog({
  isOpen,
  onOpenChange,
  invoiceToEdit,
  users,
  onSave,
}: AddEditInvoiceDialogProps) {
  const [formData, setFormData] = useState<InvoiceFormData>(initialFormState);
  const { toast } = useToast();
  const [isCancellationReasonSubDialogOpen, setIsCancellationReasonSubDialogOpen] = useState(false);

  useEffect(() => {
    if (invoiceToEdit) {
      setFormData({
        invoiceNumber: invoiceToEdit.invoiceNumber,
        date: invoiceToEdit.date,
        totalAmount: invoiceToEdit.totalAmount,
        supplierName: invoiceToEdit.supplierName,
        uniqueCode: invoiceToEdit.uniqueCode,
        address: invoiceToEdit.address || '',
        assigneeId: invoiceToEdit.assigneeId || undefined,
        status: invoiceToEdit.status || 'PENDIENTE',
        cancellationReason: invoiceToEdit.cancellationReason || undefined,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [invoiceToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalAmount' ? (parseFloat(value) || 0) : value,
    }));
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
    if (!formData.invoiceNumber || !formData.date || !formData.supplierName || !formData.uniqueCode) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "Por favor, completa todos los campos obligatorios: Número de Factura, Fecha, Proveedor y Código Único.",
      });
      return;
    }
    if (formData.totalAmount <= 0) {
       toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "El monto total debe ser un número positivo.",
      });
      return;
    }

    // Check if status is changing to CANCELADA
    if (formData.status === 'CANCELADA' && (!invoiceToEdit || invoiceToEdit.status !== 'CANCELADA')) {
      setIsCancellationReasonSubDialogOpen(true);
      // Don't save yet, wait for reason dialog
    } else {
      // If not changing to CANCELADA, or already CANCELADA, save directly
      onSave({ ...formData, cancellationReason: formData.status === 'CANCELADA' ? formData.cancellationReason : undefined }, invoiceToEdit?.id);
      onOpenChange(false);
    }
  };

  const handleConfirmCancellationWithReason = (reason?: string) => {
    const finalFormData = { ...formData, status: 'CANCELADA' as InvoiceStatus, cancellationReason: reason };
    onSave(finalFormData, invoiceToEdit?.id);
    setIsCancellationReasonSubDialogOpen(false);
    onOpenChange(false); // Close the main AddEdit dialog
  };


  const repartidores = users.filter(user => user.role === 'repartidor');
  const dialogTitle = invoiceToEdit ? 'Editar Factura' : 'Agregar Nueva Factura';
  const dialogDescription = invoiceToEdit 
    ? `Modifica los detalles de la factura ${invoiceToEdit.invoiceNumber}.`
    : "Completa los detalles de la nueva factura.";


  return (
    <>
      <Dialog open={isOpen && !isCancellationReasonSubDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-1 pr-3">
            <form onSubmit={handleSubmit} className="space-y-4 p-3">
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
              {formData.status === 'CANCELADA' && invoiceToEdit?.cancellationReason && (
                <div className="text-sm text-muted-foreground p-2 border rounded-md">
                  <p><span className="font-medium">Motivo de cancelación guardado:</span> {invoiceToEdit.cancellationReason}</p>
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
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmit}>Guardar Factura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {invoiceToEdit && (
        <CancellationReasonDialog
          isOpen={isCancellationReasonSubDialogOpen}
          onOpenChange={setIsCancellationReasonSubDialogOpen}
          invoiceIdentifier={formData.invoiceNumber || invoiceToEdit.invoiceNumber}
          onConfirm={handleConfirmCancellationWithReason}
        />
      )}
       {!invoiceToEdit && ( // For new invoices
        <CancellationReasonDialog
          isOpen={isCancellationReasonSubDialogOpen}
          onOpenChange={setIsCancellationReasonSubDialogOpen}
          invoiceIdentifier={formData.invoiceNumber || "Nueva Factura"}
          onConfirm={handleConfirmCancellationWithReason}
        />
      )}
    </>
  );
}
