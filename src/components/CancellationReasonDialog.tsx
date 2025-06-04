
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

interface CancellationReasonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceIdentifier: string; // e.g., invoice number or ID
  onConfirm: (reason?: string) => void;
}

export function CancellationReasonDialog({
  isOpen,
  onOpenChange,
  invoiceIdentifier,
  onConfirm,
}: CancellationReasonDialogProps) {
  const [providedReason, setProvidedReason] = useState<'yes' | 'no' | undefined>(undefined);
  const [reasonText, setReasonText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setProvidedReason(undefined);
      setReasonText('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (providedReason === 'yes') {
      onConfirm(reasonText.trim() || undefined); // Send trimmed text or undefined if empty
    } else {
      onConfirm(undefined); // No reason provided
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Razón de Cancelación</DialogTitle>
          <DialogDescription>
            Para la factura <span className="font-semibold">{invoiceIdentifier}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <Label className="mb-2 block">¿El cliente proporcionó una razón para la cancelación?</Label>
            <RadioGroup
              value={providedReason}
              onValueChange={(value: 'yes' | 'no') => setProvidedReason(value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="reason-yes" />
                <Label htmlFor="reason-yes">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="reason-no" />
                <Label htmlFor="reason-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          {providedReason === 'yes' && (
            <div>
              <Label htmlFor="cancellationReasonText">Motivo de la cancelación:</Label>
              <Textarea
                id="cancellationReasonText"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Escribe el motivo aquí..."
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Volver
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={providedReason === undefined || (providedReason === 'yes' && !reasonText.trim())}>
            Confirmar Cancelación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
