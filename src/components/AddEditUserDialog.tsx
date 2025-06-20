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
  onSave: (userData: { name: string; role: UserRole; password?: string }, idToEdit?: string) => void;
  availableRoles?: UserRole[];
  currentUser: User | null;
}

export function AddEditUserDialog({
  isOpen,
  onOpenChange,
  userToEdit,
  onSave,
  availableRoles = [],
  currentUser,
}: AddEditUserDialogProps) {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>(availableRoles.includes('repartidor') ? 'repartidor' : availableRoles[0] || 'repartidor');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const isEditing = !!userToEdit;
  const isEditingSelfAdmin = isEditing && userToEdit?.id === currentUser?.id && currentUser?.role === 'administrador';
  const isEditingOtherAdmin = isEditing && userToEdit?.role === 'administrador' && userToEdit?.id !== currentUser?.id;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && userToEdit) {
        setUserName(userToEdit.name);
        setUserRole(userToEdit.role);
        setPassword(''); // Always clear password field on open for editing
      } else {
        setUserName('');
        setUserRole(availableRoles.includes('repartidor') ? 'repartidor' : availableRoles[0] || 'repartidor');
        setPassword('');
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
    // Password is required for new users.
    // For editing, password is optional (if blank, it means no change).
    if (!isEditing && !password.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error de Validación',
        description: 'La contraseña es obligatoria para nuevos usuarios.',
      });
      return;
    }

    onSave({ name: userName.trim(), role: userRole, password: password.trim() ? password : undefined }, userToEdit?.id);
  };

  const resetForm = () => {
    setUserName('');
    setUserRole(availableRoles.includes('repartidor') ? 'repartidor' : availableRoles[0] || 'repartidor');
    setPassword('');
  };

  const dialogTitle = isEditing ? `Editar Usuario: ${userToEdit?.name}` : "Agregar Nuevo Usuario";
  const dialogDescription = isEditing
    ? `Actualiza los detalles para ${userToEdit?.name}. Para cambiar la contraseña, ingresa una nueva. Si dejas el campo de contraseña vacío, la contraseña actual no se modificará.`
    : "Introduce los detalles del nuevo usuario, incluyendo una contraseña.";
  const buttonText = isEditing ? "Guardar Cambios" : "Guardar Usuario";

  const roleSelectionDisabled = isEditingSelfAdmin || isEditingOtherAdmin;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-sm">{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 py-2">
          <div>
            <Label htmlFor="userName-userdialog" className="text-sm">Nombre del Usuario</Label>
            <Input
              id="userName-userdialog"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              autoFocus
              className="text-sm"
            />
          </div>
          
          <div>
            <Label htmlFor="password-userdialog" className="text-sm">
              {isEditing ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
            </Label>
            <Input
              id="password-userdialog"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditing ? "Ingresa nueva contraseña..." : "Contraseña requerida"}
              required={!isEditing} // Required only when creating a new user
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="userRole-userdialog" className="text-sm">Rol del Usuario</Label>
            <Select
              name="userRole"
              value={userRole}
              onValueChange={(value) => setUserRole(value as UserRole)}
              disabled={roleSelectionDisabled}
            >
              <SelectTrigger id="userRole-userdialog" className={`text-sm ${roleSelectionDisabled ? "bg-muted/50" : ""}`}>
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
                  resetForm();
                  onOpenChange(false);
              }} className="text-sm">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="text-sm">{buttonText}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
