
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
import { Calendar } from '@/components/ui/calendar';
import { MapIcon, PlusCircle, UserCircle, FileText, Edit } from 'lucide-react';
import type { Route, User, AssignedInvoice } from '@/lib/types';
import { format, parseISO, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface ManageRoutesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  routes: Route[];
  repartidores: User[];
  invoices: AssignedInvoice[]; // To look up invoice details
  onAddRoute: (date: Date) => void;
  onEditRoute: (route: Route) => void;
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function ManageRoutesDialog({
  isOpen,
  onOpenChange,
  routes: allRoutes,
  repartidores,
  invoices: allInvoices,
  onAddRoute,
  onEditRoute,
  selectedDate,
  onDateChange,
}: ManageRoutesDialogProps) {

  const routesForSelectedDate = React.useMemo(() => {
    if (!selectedDate) return [];
    return allRoutes.filter(route => isSameDay(parseISO(route.date), selectedDate));
  }, [allRoutes, selectedDate]);

  const getRepartidorName = (repartidorId: string) => {
    return repartidores.find(r => r.id === repartidorId)?.name || 'Desconocido';
  };

  const getInvoiceNumbersForRoute = (invoiceIds: string[]): string => {
    return invoiceIds
      .map(id => allInvoices.find(inv => inv.id === id)?.invoiceNumber)
      .filter(Boolean)
      .join(', ') || 'Ninguna';
  };

  const handleAddNewRoute = () => {
    if (selectedDate) {
      onAddRoute(selectedDate);
    }
  };
  
  const today = startOfDay(new Date());

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MapIcon className="h-6 w-6 text-primary" />
            Gestionar Rutas de Entrega
          </DialogTitle>
          <DialogDescription>
            Visualiza, crea y modifica las rutas de entrega por día.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-grow min-h-0 overflow-hidden">
          {/* Calendar Section */}
          <div className="p-4 border-b md:border-b-0 md:border-r flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              initialFocus
              locale={es}
              disabled={(date) => date < startOfDay(new Date(new Date().setDate(today.getDate() - 30))) || date > new Date(new Date().setDate(today.getDate() + 90))} // Example range: 30 days past, 90 days future
            />
          </div>

          {/* Routes List Section */}
          <div className="flex-grow p-4 min-h-0 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Rutas para: {selectedDate ? format(selectedDate, 'PPP', { locale: es }) : 'Selecciona una fecha'}
              </h3>
              <Button onClick={handleAddNewRoute} size="sm" disabled={!selectedDate}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Ruta para este Día
              </Button>
            </div>
            <ScrollArea className="flex-grow">
              {selectedDate && routesForSelectedDate.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  No hay rutas planificadas para esta fecha.
                </p>
              ) : !selectedDate ? (
                 <p className="text-sm text-muted-foreground text-center py-10">
                  Por favor, selecciona una fecha en el calendario para ver o crear rutas.
                </p>
              ) : (
                <div className="space-y-3">
                  {routesForSelectedDate.map((route) => (
                    <Card key={route.id} className="shadow-sm">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitlePrimitive className="text-base font-semibold flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-primary" />
                            Ruta de: {route.repartidorName || getRepartidorName(route.repartidorId)}
                          </CardTitlePrimitive>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEditRoute(route)}
                            className="h-7 w-7"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Estado: {route.status}</p>
                      </CardHeader>
                      <CardContent className="px-4 pb-3 text-sm">
                        <div className="flex items-start gap-1.5 text-xs">
                            <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div>
                                <span className="font-medium">Facturas: </span>
                                <span className="text-muted-foreground">{getInvoiceNumbersForRoute(route.invoiceIds)}</span>
                            </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
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
