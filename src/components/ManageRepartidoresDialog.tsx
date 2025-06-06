
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
        <DialogHeader className="border-b">
          <DialogTitle>Gestionar Repartidores</DialogTitle>
          <DialogDescription>
            Edita o elimina repartidores existentes en el sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow min-h-0"> {/* Removed overflow-auto, ScrollArea handles it */}
          <ScrollArea className="h-full">
            <div className="space-y-3"> {/* Removed padding, DialogContent handles outer padding */}
              {repartidores.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay repartidores en el sistema.
                </p>
              ) : (
                repartidores.map((repartidor) => (
                  <Card key={repartidor.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between"> {/* Changed p-3 to p-4 */}
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{repartidor.name}</span> {/* Changed font-medium to font-semibold */}
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
        </div>
        <DialogFooter className="border-t"> {/* Removed padding */}
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
