
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
  onSave: (name: string, idToEdit?: string, password?: string) => void;
  repartidorToEdit?: User | null;
}

export function AddRepartidorDialog({ isOpen, onOpenChange, onSave, repartidorToEdit }: AddRepartidorDialogProps) {
  const [repartidorName, setRepartidorName] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const isEditing = !!repartidorToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && repartidorToEdit) {
        setRepartidorName(repartidorToEdit.name);
        setPassword(''); // Password field is not for editing here
      } else {
        setRepartidorName('');
        setPassword(''); // Reset for new repartidor
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
    if (!isEditing && !password.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error de Validación',
        description: 'La contraseña es obligatoria para nuevos repartidores.',
      });
      return;
    }
    onSave(repartidorName.trim(), repartidorToEdit?.id, !isEditing ? password : undefined);
  };

  const resetForm = () => {
    setRepartidorName('');
    setPassword('');
  };

  const dialogTitle = isEditing ? "Editar Repartidor" : "Agregar Nuevo Repartidor";
  const dialogDescription = isEditing
    ? `Actualiza el nombre para ${repartidorToEdit?.name}. La contraseña no se modifica desde este diálogo.`
    : "Introduce el nombre y la contraseña para el nuevo repartidor. Se asignará automáticamente el rol de 'repartidor'.";
  const buttonText = isEditing ? "Guardar Cambios" : "Guardar Repartidor";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
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
            <Label htmlFor="repartidorName-addrepartidor">
              Nombre del Repartidor
            </Label>
            <Input
              id="repartidorName-addrepartidor"
              value={repartidorName}
              onChange={(e) => setRepartidorName(e.target.value)}
              className="col-span-3"
              autoFocus
            />
          </div>
          {!isEditing && (
            <div>
              <Label htmlFor="password-addrepartidor">
                Contraseña
              </Label>
              <Input
                id="password-addrepartidor"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                placeholder="Contraseña para el nuevo repartidor"
                required
              />
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => {
                  resetForm();
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
