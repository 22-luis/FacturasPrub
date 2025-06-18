
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
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { format, parseISO, startOfDay, isSameDay, formatISO } from 'date-fns'; // Added formatISO here
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface AddEditRouteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  routeToEdit: Route | null;
  repartidores: User[];
  allInvoices: AssignedInvoice[];
  onSave: (routeData: RouteFormData, id?: string) => void;
  selectedDateForNewRoute?: Date; // Pre-fill date if coming from ManageRoutesDialog
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
        invoiceIds: routeToEdit.invoiceIds || [], // Will be re-derived from selectedInvoices on submit
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
      setDateField(startOfDay(selectedDate));
      setFormData(prev => ({ ...prev, date: formatISO(startOfDay(selectedDate), { representation: 'date' }) }));
      // Potentially reset selected invoices if date changes significantly and invoices are date-specific
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
      status: formData.status || 'PLANNED', // Ensure status is set
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
    // Show PENDIENTE invoices. If editing, also include those already on the route.
    // For simplicity in mocks, show PENDIENTE invoices for the selected route date OR if they are already on the route.
    const routeDate = parseISO(formData.date);
    return allInvoices.filter(inv => 
        inv.status === 'PENDIENTE' && 
        (isSameDay(parseISO(inv.date), routeDate) || (routeToEdit && routeToEdit.invoiceIds.includes(inv.id)))
    ).sort((a,b) => a.invoiceNumber.localeCompare(b.invoiceNumber));
  }, [allInvoices, formData.date, routeToEdit]);


  const dialogTitle = routeToEdit ? 'Editar Ruta de Entrega' : 'Crear Nueva Ruta de Entrega';
  const dialogDescription = routeToEdit
    ? `Modifica la ruta para ${repartidores.find(r=>r.id === routeToEdit.repartidorId)?.name || 'el repartidor'} del ${format(parseISO(routeToEdit.date), 'PPP', {locale: es})}.`
    : `Planifica una nueva ruta de entrega. Fecha por defecto: ${selectedDateForNewRoute ? format(selectedDateForNewRoute, 'PPP', {locale:es}) : format(new Date(), 'PPP', {locale:es}) }.`;

  return (
    <Dialog open={isOpen} onOpenChange={resetFormAndClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0 p-4 sm:p-6 space-y-4">
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
                    disabled={(date) => date < startOfDay(new Date(new Date().setDate(startOfDay(new Date()).getDate() - 7))) || date > new Date(new Date().setDate(startOfDay(new Date()).getDate() + 90))}
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
                Mostrando facturas pendientes para el {format(parseISO(formData.date), "PPP", { locale: es })} o ya en esta ruta.
            </p>
            {availableInvoicesForRoute.length === 0 ? (
                 <p className="text-sm text-center text-muted-foreground p-4 border rounded-md">No hay facturas pendientes disponibles para la fecha seleccionada.</p>
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

          <DialogFooter className="pt-4 mt-auto border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={resetFormAndClose}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Guardar Ruta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
