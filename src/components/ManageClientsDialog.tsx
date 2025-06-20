
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
import { Card, CardContent, CardHeader, CardTitle as CardTitlePrimitive } from '@/components/ui/card';
import { Building, Pencil, Trash2, PlusCircle, Phone, MapPin } from 'lucide-react';
import type { Client } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface ManageClientsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  onAddClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (client: Client) => void;
}

export function ManageClientsDialog({
  isOpen,
  onOpenChange,
  clients,
  onAddClient,
  onEditClient,
  onDeleteClient,
}: ManageClientsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            Gestionar Clientes
          </DialogTitle>
          <DialogDescription>
            Agrega, edita o elimina clientes del sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 pt-4 pb-2 border-b">
            <Button onClick={onAddClient} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Nuevo Cliente
            </Button>
        </div>
        
        <div className="flex-grow min-h-0 overflow-hidden"> {/* Wrapper for scroll, NO PADDING */}
          <ScrollArea className="h-full"> {/* ScrollArea fills wrapper, NO PADDING */}
            <div className="px-4 sm:px-6 py-4 space-y-3"> {/* Actual content list with PADDING */}
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  No hay clientes registrados. Haz clic en "Agregar Nuevo Cliente" para empezar.
                </p>
              ) : (
                clients.map((client) => (
                  <Card key={client.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 pt-3 px-4">
                        <div className="flex items-center justify-between gap-2">
                            <CardTitlePrimitive className="text-base font-semibold truncate" title={client.name}>
                                {client.name}
                            </CardTitlePrimitive>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onEditClient(client)}
                                aria-label={`Editar ${client.name}`}
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                >
                                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => onDeleteClient(client)}
                                aria-label={`Eliminar ${client.name}`}
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 text-xs text-muted-foreground space-y-1">
                        {client.phone && (
                            <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 flex-shrink-0"/>
                                <span>{client.phone}</span>
                            </div>
                        )}
                        {client.mainAddress && (
                            <div className="flex items-start gap-1.5"> {/* items-start for multi-line address */}
                                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0"/>
                                <span className="truncate" title={client.mainAddress}>{client.mainAddress}</span>
                            </div>
                        )}
                        {client.branches && client.branches.length > 0 && (
                             <Badge variant="secondary" className="mt-1.5 text-xs">
                                {client.branches.length} {client.branches.length === 1 ? 'Sucursal' : 'Sucursales'}
                            </Badge>
                        )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
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
