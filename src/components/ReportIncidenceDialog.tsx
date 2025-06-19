
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { IncidenceType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface ReportIncidenceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  currentIncidenceType?: IncidenceType | null;
  currentIncidenceDetails?: string | null;
  onConfirmIncidence: (type: IncidenceType, details: string) => void;
  onClearIncidence?: () => void; // Optional: to clear an existing incidence
}

const incidenceOptions: { value: IncidenceType; label: string }[] = [
  { value: 'REFACTURACION', label: 'Refacturación Necesaria' },
  { value: 'DEVOLUCION', label: 'Devolución de Producto' },
  { value: 'NEGOCIACION', label: 'Negociación con Cliente' },
];

export function ReportIncidenceDialog({
  isOpen,
  onOpenChange,
  invoiceNumber,
  currentIncidenceType,
  currentIncidenceDetails,
  onConfirmIncidence,
  onClearIncidence,
}: ReportIncidenceDialogProps) {
  const [selectedType, setSelectedType] = useState<IncidenceType | null>(null);
  const [details, setDetails] = useState('');
  const { toast } = useToast();

  const isEditingIncidence = !!currentIncidenceType;

  useEffect(() => {
    if (isOpen) {
      setSelectedType(currentIncidenceType || null);
      setDetails(currentIncidenceDetails || '');
    } else {
      // Reset when dialog is closed externally
      setSelectedType(null);
      setDetails('');
    }
  }, [isOpen, currentIncidenceType, currentIncidenceDetails]);

  const handleSubmit = () => {
    if (!selectedType) {
      toast({
        variant: 'destructive',
        title: 'Error de Validación',
        description: 'Por favor, selecciona un tipo de incidencia.',
      });
      return;
    }
    if (!details.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error de Validación',
        description: 'Por favor, proporciona detalles para la incidencia.',
      });
      return;
    }
    onConfirmIncidence(selectedType, details.trim());
    onOpenChange(false); // Close dialog on successful confirm
  };

  const handleClearAndClose = () => {
    if (onClearIncidence) {
        onClearIncidence();
    }
    onOpenChange(false);
  }
  
  const dialogTitle = isEditingIncidence ? `Modificar Incidencia para Factura ${invoiceNumber}` : `Reportar Nueva Incidencia para Factura ${invoiceNumber}`;
  const confirmButtonText = isEditingIncidence ? "Actualizar Incidencia" : "Reportar Incidencia";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Selecciona el tipo de incidencia y proporciona los detalles necesarios.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="incidenceType-select">Tipo de Incidencia</Label>
            <Select
              value={selectedType || ''}
              onValueChange={(value) => setSelectedType(value as IncidenceType)}
            >
              <SelectTrigger id="incidenceType-select">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {incidenceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value!}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="incidenceDetails-textarea">Detalles de la Incidencia</Label>
            <Textarea
              id="incidenceDetails-textarea"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe la incidencia en detalle..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter className="items-center gap-2 sm:gap-0">
          {isEditingIncidence && onClearIncidence && (
             <Button type="button" variant="destructive" onClick={handleClearAndClose} className="w-full sm:w-auto sm:mr-auto">
                Marcar como Resuelta / Borrar
            </Button>
          )}
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} className="w-full sm:w-auto">
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
