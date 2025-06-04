
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
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';

interface AddRepartidorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, idToEdit?: string) => void;
  repartidorToEdit?: User | null;
}

export function AddRepartidorDialog({ isOpen, onOpenChange, onSave, repartidorToEdit }: AddRepartidorDialogProps) {
  const [repartidorName, setRepartidorName] = useState('');
  const { toast } = useToast();

  const isEditing = !!repartidorToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && repartidorToEdit) {
        setRepartidorName(repartidorToEdit.name);
      } else {
        setRepartidorName(''); // Reset name for adding or if dialog opens without edit context
      }
    }
  }, [isOpen, repartidorToEdit, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repartidorName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error de Validación',
        description: 'El nombre del repartidor no puede estar vacío.',
      });
      return;
    }
    onSave(repartidorName.trim(), repartidorToEdit?.id);
  };

  const dialogTitle = isEditing ? "Editar Repartidor" : "Agregar Nuevo Repartidor";
  const dialogDescription = isEditing 
    ? `Actualiza el nombre para ${repartidorToEdit?.name}.`
    : "Introduce el nombre del nuevo repartidor. Se asignará automáticamente el rol de 'repartidor'.";
  const buttonText = isEditing ? "Guardar Cambios" : "Guardar Repartidor";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) { // Ensure state resets if dialog is closed by clicking outside or X
        setRepartidorName(''); 
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="repartidorName" className="text-right">
              Nombre del Repartidor
            </Label>
            <Input
              id="repartidorName"
              value={repartidorName}
              onChange={(e) => setRepartidorName(e.target.value)}
              className="col-span-3"
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => {
                  setRepartidorName(''); // Also reset on explicit cancel
                  onOpenChange(false);
              }}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">{buttonText}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
