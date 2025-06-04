
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

interface AddRepartidorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

export function AddRepartidorDialog({ isOpen, onOpenChange, onSave }: AddRepartidorDialogProps) {
  const [repartidorName, setRepartidorName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setRepartidorName(''); // Reset name when dialog opens
    }
  }, [isOpen]);

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
    onSave(repartidorName.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Repartidor</DialogTitle>
          <DialogDescription>
            Introduce el nombre del nuevo repartidor. Se asignará automáticamente el rol de 'repartidor'.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Guardar Repartidor</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
