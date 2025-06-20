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
  allInvoices?: AssignedInvoice[];
  allRoutes?: Route[];
  onSave: (routeData: RouteFormData, id?: string) => void;
  selectedDateForNewRoute?: Date;
}

const initialDialogFormState: RouteFormData = {
  date: formatISO(startOfDay(new Date()), { representation: 'date' }),
  repartidorId: '',
  invoiceIds: [],
  status: 'PLANNED',
};

const ADD_EDIT_ROUTE_FORM_ID = "addEditRouteForm";

export function AddEditRouteDialog({
  isOpen,
  onOpenChange,
  routeToEdit,
  repartidores,
  allInvoices,
  allRoutes,
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

    const invoiceIdsInOtherRoutesOnThisDate = (allRoutes || [])
      .filter(r => r.date === routeDateStr && r.id !== routeToEdit?.id)
      .flatMap(r => r.invoiceIds);
    const uniqueInvoiceIdsInOtherRoutes = new Set(invoiceIdsInOtherRoutesOnThisDate);

    return (allInvoices || []).filter(inv => {
      if (inv.status !== 'PENDIENTE') return false;

      if (routeToEdit && routeToEdit.invoiceIds.includes(inv.id)) {
        return true;
      }

      if (uniqueInvoiceIdsInOtherRoutes.has(inv.id)) {
        return false;
      }

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
      <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader className="p-3 sm:p-4 md:p-6 border-b bg-background">
          <DialogTitle className="text-lg sm:text-xl">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-sm">{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form id={ADD_EDIT_ROUTE_FORM_ID} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="route-date" className="text-sm">Fecha de la Ruta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="route-date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm",
                      !dateField && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateField ? format(dateField, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateField}
                    onSelect={handleDateChange}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="route-repartidor" className="text-sm">Repartidor</Label>
              <Select
                name="repartidorId"
                value={formData.repartidorId}
                onValueChange={handleRepartidorChange}
              >
                <SelectTrigger id="route-repartidor" className="text-sm">
                  <SelectValue placeholder="Seleccionar repartidor..." />
                </SelectTrigger>
                <SelectContent>
                  {(repartidores || []).map(repartidor => (
                    <SelectItem key={repartidor.id} value={repartidor.id}>
                      {repartidor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm">Facturas Disponibles para la Ruta</Label>
            <div className="mt-2 border rounded-md p-3 sm:p-4 max-h-60 overflow-y-auto">
              {availableInvoicesForRoute.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay facturas disponibles para esta fecha y repartidor.
                </p>
              ) : (
                <div className="space-y-2">
                  {availableInvoicesForRoute.map((invoice) => (
                    <div key={invoice.id} className="flex items-center space-x-2 p-2 rounded border">
                      <Checkbox
                        id={`invoice-${invoice.id}`}
                        checked={selectedInvoices.has(invoice.id)}
                        onCheckedChange={() => handleInvoiceToggle(invoice.id)}
                      />
                      <Label
                        htmlFor={`invoice-${invoice.id}`}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <span className="font-medium">Factura #{invoice.invoiceNumber}</span>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                            <span>Cliente: {invoice.client?.name || 'N/A'}</span>
                            <span>Monto: ${invoice.totalAmount?.toLocaleString() || 'N/A'}</span>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="route-status" className="text-sm">Estado de la Ruta</Label>
            <Select
              name="status"
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as RouteStatus }))}
            >
              <SelectTrigger id="route-status" className="text-sm">
                <SelectValue placeholder="Seleccionar estado..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">Planificada</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="COMPLETED">Completada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter className="p-3 sm:p-4 md:p-6 border-t bg-background">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={resetFormAndClose} className="text-sm">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" form={ADD_EDIT_ROUTE_FORM_ID} className="text-sm">
            {routeToEdit ? 'Actualizar Ruta' : 'Crear Ruta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
