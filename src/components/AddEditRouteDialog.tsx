
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Route, RouteFormData, User, AssignedInvoice, RouteStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO, startOfDay, isSameDay, formatISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface AddEditRouteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  routeToEdit: Route | null;
  repartidores: User[];
  allInvoices: AssignedInvoice[];
  allRoutes: Route[]; // Added to check for existing invoice assignments
  onSave: (routeData: RouteFormData, id?: string) => void;
  selectedDateForNewRoute?: Date;
}

const initialDialogFormState: RouteFormData = {
  date: formatISO(startOfDay(new Date()), { representation: 'date' }),
  repartidorId: '',
  invoiceIds: [],
  status: 'PLANNED',
};

export function AddEditRouteDialog({
  isOpen,
  onOpenChange,
  routeToEdit,
  repartidores,
  allInvoices,
  allRoutes, // Destructure allRoutes
  onSave,
  selectedDateForNewRoute,
}: AddEditRouteDialogProps) {
  const [formData, setFormData] = useState<RouteFormData>(initialDialogFormState);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [dateField, setDateField] = useState<Date | undefined>(
    selectedDateForNewRoute ? startOfDay(selectedDateForNewRoute) : startOfDay(new Date())
  );

  useEffect(() => {
    const initialDate = routeToEdit 
      ? startOfDay(parseISO(routeToEdit.date))
      : selectedDateForNewRoute 
        ? startOfDay(selectedDateForNewRoute)
        : startOfDay(new Date());
    
    setDateField(initialDate);

    if (routeToEdit && isOpen) {
      setFormData({
        date: formatISO(initialDate, { representation: 'date' }),
        repartidorId: routeToEdit.repartidorId,
        invoiceIds: routeToEdit.invoiceIds || [],
        status: routeToEdit.status,
      });
      setSelectedInvoices(new Set(routeToEdit.invoiceIds || []));
    } else if (isOpen) {
      setFormData({
        ...initialDialogFormState,
        date: formatISO(initialDate, { representation: 'date' }),
      });
      setSelectedInvoices(new Set());
    }
  }, [routeToEdit, isOpen, selectedDateForNewRoute]);

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = startOfDay(selectedDate);
      setDateField(newDate);
      setFormData(prev => ({ ...prev, date: formatISO(newDate, { representation: 'date' }) }));
      // Reset selected invoices if date changes, as availability might change
      // setSelectedInvoices(new Set()); 
    }
  };

  const handleRepartidorChange = (repartidorId: string) => {
    setFormData(prev => ({ ...prev, repartidorId }));
  };

  const handleInvoiceToggle = (invoiceId: string) => {
    setSelectedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.repartidorId) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "La fecha y el repartidor son obligatorios.",
      });
      return;
    }
    if (selectedInvoices.size === 0) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "Debe seleccionar al menos una factura para la ruta.",
      });
      return;
    }

    const dataToSave: RouteFormData = {
      ...formData,
      invoiceIds: Array.from(selectedInvoices),
      status: formData.status || 'PLANNED',
    };
    onSave(dataToSave, routeToEdit?.id);
  };
  
  const resetFormAndClose = () => {
    const defaultDate = selectedDateForNewRoute ? startOfDay(selectedDateForNewRoute) : startOfDay(new Date());
    setDateField(defaultDate);
    setFormData({
        ...initialDialogFormState,
        date: formatISO(defaultDate, { representation: 'date' })
    });
    setSelectedInvoices(new Set());
    onOpenChange(false);
  };

  const availableInvoicesForRoute = useMemo(() => {
    const routeDateStr = formData.date;

    const invoiceIdsInOtherRoutesOnThisDate = allRoutes
      .filter(r => r.date === routeDateStr && r.id !== routeToEdit?.id)
      .flatMap(r => r.invoiceIds);
    const uniqueInvoiceIdsInOtherRoutes = new Set(invoiceIdsInOtherRoutesOnThisDate);

    return allInvoices.filter(inv => {
      if (inv.status !== 'PENDIENTE') return false;

      if (routeToEdit && routeToEdit.invoiceIds.includes(inv.id)) {
        return true; // Always show invoices that are already part of the route being edited
      }

      // If not part of the route being edited, it must not be in another route for the same day
      if (uniqueInvoiceIdsInOtherRoutes.has(inv.id)) {
        return false;
      }
      
      // Additionally, for new invoices or those not on the current edited route,
      // ensure their own date aligns with the route's date for relevance.
      // This check was present before and helps narrow down options.
      return isSameDay(parseISO(inv.date), parseISO(routeDateStr));

    }).sort((a,b) => a.invoiceNumber.localeCompare(b.invoiceNumber));
  }, [allInvoices, allRoutes, formData.date, routeToEdit]);


  const dialogTitle = routeToEdit ? 'Editar Ruta de Entrega' : 'Crear Nueva Ruta de Entrega';
  const dialogDescriptionDate = dateField ? format(dateField, 'PPP', {locale:es}) : format(new Date(), 'PPP', {locale:es});
  const dialogDescription = routeToEdit
    ? `Modifica la ruta para ${repartidores.find(r=>r.id === routeToEdit.repartidorId)?.name || 'el repartidor'} del ${dialogDescriptionDate}.`
    : `Planifica una nueva ruta de entrega. Fecha: ${dialogDescriptionDate}.`;

  return (
    <Dialog open={isOpen} onOpenChange={resetFormAndClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 border-b sticky top-0 bg-background z-10">
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="route-date">Fecha de la Ruta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="route-date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateField && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateField ? format(dateField, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateField}
                      onSelect={handleDateChange}
                      initialFocus
                      locale={es}
                      disabled={(date) => date < startOfDay(new Date(new Date().setDate(startOfDay(new Date()).getDate() - 30))) || date > new Date(new Date().setDate(startOfDay(new Date()).getDate() + 90))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="route-repartidor">Repartidor</Label>
                <Select
                  name="repartidorId"
                  value={formData.repartidorId}
                  onValueChange={handleRepartidorChange}
                  required
                >
                  <SelectTrigger id="route-repartidor">
                    <SelectValue placeholder="Seleccionar repartidor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {repartidores.filter(r => r.role === 'repartidor').map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Facturas Pendientes para Asignar</Label>
              <p className="text-xs text-muted-foreground mb-2">
                  Mostrando facturas PENDIENTES para el {formData.date ? format(parseISO(formData.date), "PPP", { locale: es }) : 'día seleccionado'}
                  {routeToEdit ? ', o que ya están en esta ruta. Las facturas en otras rutas de este día no aparecerán.' : '. Las facturas ya asignadas a otras rutas en este día no aparecerán.'}
              </p>
              {availableInvoicesForRoute.length === 0 ? (
                   <p className="text-sm text-center text-muted-foreground p-4 border rounded-md">No hay facturas pendientes elegibles para esta fecha y que no estén en otras rutas.</p>
              ): (
                  <ScrollArea className="h-64 border rounded-md">
                      <div className="p-3 space-y-2">
                      {availableInvoicesForRoute.map(invoice => (
                          <div key={invoice.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <Checkbox
                              id={`invoice-${invoice.id}`}
                              checked={selectedInvoices.has(invoice.id)}
                              onCheckedChange={() => handleInvoiceToggle(invoice.id)}
                          />
                          <Label htmlFor={`invoice-${invoice.id}`} className="flex-grow text-sm font-normal cursor-pointer">
                              {invoice.invoiceNumber} - {invoice.supplierName} (${invoice.totalAmount.toFixed(2)})
                              {invoice.client?.name && <span className="text-xs text-muted-foreground"> (Cliente: {invoice.client.name})</span>}
                          </Label>
                          </div>
                      ))}
                      </div>
                  </ScrollArea>
              )}
            </div>
          </form>
        </div>

        <DialogFooter className="p-4 sm:p-6 border-t sticky bottom-0 bg-background z-10">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={resetFormAndClose}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}>Guardar Ruta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
