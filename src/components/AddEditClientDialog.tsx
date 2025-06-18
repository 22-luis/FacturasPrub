
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
import { Textarea } from '@/components/ui/textarea';
import type { Client, ClientFormData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AddEditClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientToEdit: Client | null;
  onSave: (clientData: ClientFormData, id?: string) => void;
}

const initialDialogFormState: ClientFormData = {
  name: '',
  phone: '',
  mainAddress: '',
};

export function AddEditClientDialog({
  isOpen,
  onOpenChange,
  clientToEdit,
  onSave,
}: AddEditClientDialogProps) {
  const [formData, setFormData] = useState<ClientFormData>(initialDialogFormState);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setFormData({
          name: clientToEdit.name,
          phone: clientToEdit.phone || '',
          mainAddress: clientToEdit.mainAddress || '',
        });
      } else {
        setFormData(initialDialogFormState);
      }
    }
  }, [clientToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error de Validación',
        description: 'El nombre del cliente es obligatorio.',
      });
      return;
    }
    onSave(formData, clientToEdit?.id);
  };
  
  const resetFormAndClose = () => {
    setFormData(initialDialogFormState);
    onOpenChange(false);
  };

  const dialogTitle = clientToEdit ? 'Editar Cliente' : 'Agregar Nuevo Cliente';
  const dialogDescription = clientToEdit
    ? `Modifica los detalles del cliente ${clientToEdit.name}.`
    : 'Completa los detalles del nuevo cliente.';

  return (
    <Dialog open={isOpen} onOpenChange={resetFormAndClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="client-name">Nombre del Cliente / Empresa</Label>
            <Input
              id="client-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="client-phone">Teléfono de Contacto</Label>
            <Input
              id="client-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="client-mainAddress">Dirección Principal</Label>
            <Textarea
              id="client-mainAddress"
              name="mainAddress"
              value={formData.mainAddress}
              onChange={handleChange}
              rows={3}
            />
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={resetFormAndClose}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Guardar Cliente</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
