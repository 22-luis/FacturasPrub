
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
// ScrollArea import removed
import type { AssignedInvoice, User, InvoiceFormData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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
  assigneeId: undefined,
};

export function AddEditInvoiceDialog({
  isOpen,
  onOpenChange,
  invoiceToEdit,
  users,
  onSave,
}: AddEditInvoiceDialogProps) {
  const [formData, setFormData] = useState<InvoiceFormData>(initialFormState);
  const { toast } = useToast();

  useEffect(() => {
    if (invoiceToEdit) {
      setFormData({
        invoiceNumber: invoiceToEdit.invoiceNumber,
        date: invoiceToEdit.date,
        totalAmount: invoiceToEdit.totalAmount,
        supplierName: invoiceToEdit.supplierName,
        uniqueCode: invoiceToEdit.uniqueCode,
        assigneeId: invoiceToEdit.assigneeId || undefined,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [invoiceToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalAmount' ? (parseFloat(value) || 0) : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      assigneeId: value === 'unassigned' ? undefined : value,
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

    onSave(formData, invoiceToEdit?.id);
    onOpenChange(false);
  };

  const repartidores = users.filter(user => user.role === 'repartidor');
  const dialogTitle = invoiceToEdit ? 'Editar Factura' : 'Agregar Nueva Factura';
  const dialogDescription = invoiceToEdit 
    ? `Modifica los detalles de la factura ${invoiceToEdit.invoiceNumber}.`
    : "Completa los detalles de la nueva factura.";


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        {/* Replaced ScrollArea with a div for scrolling */}
        <div className="flex-grow overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4"> {/* Removed p-4 from form, added to wrapper div */}
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
                value={formData.totalAmount} // React handles converting number to string for display
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
              <Label htmlFor="assigneeId">Asignar a Repartidor</Label>
              <Select
                name="assigneeId"
                value={formData.assigneeId || 'unassigned'}
                onValueChange={handleSelectChange}
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
  );
}
