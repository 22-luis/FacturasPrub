
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AddEditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit: User | null;
  onSave: (userData: { name: string; role: UserRole }, idToEdit?: string) => void;
  availableRoles: UserRole[]; // Roles that can be assigned/changed to (e.g., 'supervisor', 'repartidor')
  currentUser: User | null; // To prevent admin from changing own role
}

export function AddEditUserDialog({
  isOpen,
  onOpenChange,
  userToEdit,
  onSave,
  availableRoles,
  currentUser,
}: AddEditUserDialogProps) {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>(availableRoles.includes('repartidor') ? 'repartidor' : availableRoles[0]);
  const { toast } = useToast();

  const isEditing = !!userToEdit;
  const isEditingSelfAdmin = isEditing && userToEdit?.id === currentUser?.id && currentUser?.role === 'administrador';
  const isEditingOtherAdmin = isEditing && userToEdit?.role === 'administrador' && userToEdit?.id !== currentUser?.id;


  useEffect(() => {
    if (isOpen) {
      if (isEditing && userToEdit) {
        setUserName(userToEdit.name);
        setUserRole(userToEdit.role);
      } else { // Adding new user
        setUserName('');
        // Default to 'repartidor' if available, otherwise first in list
        setUserRole(availableRoles.includes('repartidor') ? 'repartidor' : availableRoles[0] || 'repartidor');
      }
    }
  }, [isOpen, userToEdit, isEditing, availableRoles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error de Validación',
        description: 'El nombre del usuario no puede estar vacío.',
      });
      return;
    }
    if (!userRole) {
       toast({
        variant: 'destructive',
        title: 'Error de Validación',
        description: 'Debe seleccionar un rol para el usuario.',
      });
      return;
    }

    onSave({ name: userName.trim(), role: userRole }, userToEdit?.id);
  };

  const dialogTitle = isEditing ? `Editar Usuario: ${userToEdit?.name}` : "Agregar Nuevo Usuario";
  const dialogDescription = isEditing
    ? `Actualiza los detalles para ${userToEdit?.name}.`
    : "Introduce los detalles del nuevo usuario.";
  const buttonText = isEditing ? "Guardar Cambios" : "Guardar Usuario";

  const roleSelectionDisabled = isEditingSelfAdmin || isEditingOtherAdmin;


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setUserName('');
        setUserRole(availableRoles.includes('repartidor') ? 'repartidor' : availableRoles[0] || 'repartidor');
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="userName">Nombre del Usuario</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="userRole">Rol del Usuario</Label>
            <Select
              name="userRole"
              value={userRole}
              onValueChange={(value) => setUserRole(value as UserRole)}
              disabled={roleSelectionDisabled}
            >
              <SelectTrigger id="userRole" className={roleSelectionDisabled ? "bg-muted/50" : ""}>
                <SelectValue placeholder="Seleccionar rol..." />
              </SelectTrigger>
              <SelectContent>
                {roleSelectionDisabled && userToEdit?.role && (
                     <SelectItem value={userToEdit.role} disabled>
                        {userToEdit.role.charAt(0).toUpperCase() + userToEdit.role.slice(1)} (No se puede cambiar)
                     </SelectItem>
                )}
                {!roleSelectionDisabled && availableRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {roleSelectionDisabled && userToEdit?.role === 'administrador' && (
                <p className="text-xs text-muted-foreground mt-1">El rol de administrador no se puede modificar desde esta interfaz.</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => {
                  setUserName('');
                  setUserRole(availableRoles.includes('repartidor') ? 'repartidor' : availableRoles[0] || 'repartidor');
                  onOpenChange(false);
              }}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">{buttonText}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
