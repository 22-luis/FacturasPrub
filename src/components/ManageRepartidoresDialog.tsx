
'use client';

import React from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card'; 
import { User, Pencil, Trash2 } from 'lucide-react';
import type { User as UserType } from '@/lib/types';

interface ManageRepartidoresDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  repartidores: UserType[];
  onEdit: (repartidor: UserType) => void;
  onDelete: (repartidor: UserType) => void;
}

export function ManageRepartidoresDialog({
  isOpen,
  onOpenChange,
  repartidores,
  onEdit,
  onDelete,
}: ManageRepartidoresDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <DialogTitle>Gestionar Repartidores</DialogTitle>
          <DialogDescription>
            Edita o elimina repartidores existentes en el sistema.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow min-h-0">
          <div className="space-y-3 p-4 sm:p-6"> 
            {repartidores.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay repartidores en el sistema.
              </p>
            ) : (
              repartidores.map((repartidor) => (
                <Card key={repartidor.id} className="shadow-sm">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <span className="font-medium">{repartidor.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onEdit(repartidor)}
                        aria-label={`Editar ${repartidor.name}`}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => onDelete(repartidor)}
                        aria-label={`Eliminar ${repartidor.name}`}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="p-4 sm:p-6 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
