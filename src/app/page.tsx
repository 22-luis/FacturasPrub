'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
// Link component might be used later, keeping it for now.
// import Link from 'next/link'; 
import { AppHeader } from '@/components/AppHeader';
import { InvoiceCard } from '@/components/InvoiceCard';
import { ProcessInvoiceDialog } from '@/components/ProcessInvoiceDialog';
import { AddEditInvoiceDialog } from '@/components/AddEditInvoiceDialog';
import { AddRepartidorDialog } from '@/components/AddRepartidorDialog';
import { ManageRepartidoresDialog } from '@/components/ManageRepartidoresDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AddEditUserDialog } from '@/components/AddEditUserDialog';
import { ManageAllUsersDialog } from '@/components/ManageAllUsersDialog';
import { AddEditClientDialog } from '@/components/AddEditClientDialog';
import { ManageClientsDialog } from '@/components/ManageClientsDialog';
import { ManageRoutesDialog } from '@/components/ManageRoutesDialog';
import { AddEditRouteDialog } from '@/components/AddEditRouteDialog';
import { AppSidebar } from '@/components/AppSidebar'; 
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'; 
import { useAuth } from '@/contexts/AuthContext';

import type { AssignedInvoice, User, InvoiceFormData, InvoiceStatus, UserRole, Client, ClientFormData, Route, RouteFormData, RouteStatus, IncidenceType } from '@/lib/types';
import { Toaster } from "@/components/ui/toaster";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, UserSquare2, Archive, UserPlus, LogIn, AlertTriangle, CheckCircle2, XCircle, ListFilter, Users, Search, Filter, Settings2, Users2 as UsersIconLucide, Building as BuildingIcon, MapIcon, PackageSearch, PackageCheck, ShieldX, Warehouse, FileWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
// bcrypt is used for client-side password comparison if needed, but login is now API based.
// import bcrypt from 'bcryptjs'; 
import { mockUsers, mockInvoices as initialMockInvoices, mockClients as initialMockClients, mockRoutes as initialMockRoutes } from '@/lib/mock-data';
import { formatISO, startOfDay, parseISO, isSameDay } from 'date-fns';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const UNASSIGNED_KEY = "unassigned_invoices_key";
const ALL_REPARTIDORES_KEY = "all_repartidores_filter_key";
const INCIDENCES_KEY = "incidences_filter_key";

const invoiceStatusesArray: InvoiceStatus[] = ['PENDIENTE', 'EN_PREPARACION', 'LISTO_PARA_RUTA', 'ENTREGADA', 'CANCELADA', 'INCIDENCIA_BODEGA'];


const statusCardDetails: Record<InvoiceStatus, { label: string; Icon: React.ElementType; description: string }> = {
  PENDIENTE: { label: 'Facturas Pendientes', Icon: AlertTriangle, description: "Nuevas o por asignar/procesar" },
  EN_PREPARACION: { label: 'En Preparación (Bodega)', Icon: PackageSearch, description: "Bodega preparando el pedido" },
  LISTO_PARA_RUTA: { label: 'Listas para Ruta (Bodega)', Icon: PackageCheck, description: "Preparadas, esperando repartidor" },
  ENTREGADA: { label: 'Facturas Entregadas', Icon: CheckCircle2, description: "Confirmadas y finalizadas" },
  CANCELADA: { label: 'Facturas Canceladas', Icon: XCircle, description: "Anuladas del sistema" },
  INCIDENCIA_BODEGA: { label: 'Incidencias Bodega', Icon: ShieldX, description: "Problema reportado por bodega" },
};

const manageableUserRoles: UserRole[] = ['supervisor', 'repartidor', 'bodega']; 


export default function HomePage() {
  const { user: loggedInUser, login, logout, isLoading: authLoading } = useAuth();
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processingInvoice, setProcessingInvoice] = useState<AssignedInvoice | null>(null);

  const [isAddEditInvoiceDialogOpen, setIsAddEditInvoiceDialogOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<AssignedInvoice | null>(null);

  const [isAddRepartidorDialogOpen, setIsAddRepartidorDialogOpen] = useState(false);
  const [repartidorToEditFromSupervisor, setRepartidorToEditFromSupervisor] = useState<User | null>(null);
  const [isManageRepartidoresOpen, setIsManageRepartidoresOpen] = useState(false);
  const [isConfirmDeleteRepartidorOpen, setIsConfirmDeleteRepartidorOpen] = useState(false);
  const [repartidorToDelete, setRepartidorToDelete] = useState<User | null>(null);

  const [isAddEditUserDialogOpen, setIsAddEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isConfirmDeleteUserOpen, setIsConfirmDeleteUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isManageAllUsersDialogOpen, setIsManageAllUsersDialogOpen] = useState(false);

  const [isAddEditClientDialogOpen, setIsAddEditClientDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [isManageClientsDialogOpen, setIsManageClientsDialogOpen] = useState(false);
  const [isConfirmDeleteClientOpen, setIsConfirmDeleteClientOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const [isManageRoutesDialogOpen, setIsManageRoutesDialogOpen] = useState(false);
  const [isAddEditRouteDialogOpen, setIsAddEditRouteDialogOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState<Route | null>(null);
  const [selectedDateForRoutesDialog, setSelectedDateForRoutesDialog] = useState<Date | undefined>(startOfDay(new Date()));


  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [invoices, setInvoices] = useState<AssignedInvoice[]>([]);
  const { toast } = useToast();

  const [selectedRepartidorIdBySupervisor, setSelectedRepartidorIdBySupervisor] = useState<string | null>(ALL_REPARTIDORES_KEY);
  const [selectedStatusBySupervisor, setSelectedStatusBySupervisor] = useState<InvoiceStatus | 'INCIDENCES_FILTER_KEY' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      const data: User[] = await response.json();
      setUsers(data.map(u => ({...u, role: u.role.toLowerCase() as UserRole })));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Cargar Usuarios', description: error.message });
      setUsers(mockUsers.map(u => ({...u, role: u.role.toLowerCase() as UserRole }))); // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      const data: Client[] = await response.json();
      setClients(data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Cargar Clientes', description: error.message });
      setClients(initialMockClients); // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/routes');
       if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      const data: Route[] = await response.json();
      // Populate repartidorName and invoices client-side for now
      const currentUsersToUse = users.length > 0 ? users : mockUsers.map(u => ({...u, role: u.role.toLowerCase() as UserRole }));
      const currentInvoicesToUse = invoices.length > 0 ? invoices : initialMockInvoices;

      const populatedRoutes = data.map(route => {
        const repartidor = currentUsersToUse.find(u => u.id === route.repartidorId);
        const routeInvoices = route.invoiceIds
          .map(id => currentInvoicesToUse.find(inv => inv.id === id))
          .filter(inv => inv !== undefined) as AssignedInvoice[];
        return {
          ...route,
          repartidorName: repartidor?.name,
          invoices: routeInvoices, // This might be better handled by the API or a separate query
        };
      });
      setRoutes(populatedRoutes);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Cargar Rutas', description: error.message });
      setRoutes(initialMockRoutes); // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [toast, users, invoices]);


  const fetchInvoices = useCallback(async (queryParams: Record<string, string> = {}) => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams(queryParams).toString();
      const response = await fetch(`/api/invoices${query ? `?${query}` : ''}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      const data: AssignedInvoice[] = await response.json();
      
      const currentUsers = users.length > 0 ? users : mockUsers.map(u => ({...u, role: u.role.toLowerCase() as UserRole }));
      const currentClients = clients.length > 0 ? clients : initialMockClients;
      
      // Client-side population of assignee and client details, if API doesn't provide them fully populated
      const invoicesWithDetails = data.map(inv => {
          const assignee = currentUsers.find(u => u.id === inv.assigneeId);
          const client = currentClients.find(c => c.id === inv.clientId);
          return {
              ...inv,
              assignee: assignee ? { id: assignee.id, name: assignee.name } : inv.assignee || null,
              client: client || inv.client || null,
          };
      });
      setInvoices(invoicesWithDetails);

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Cargar Facturas', description: error.message });
      setInvoices(initialMockInvoices); // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [toast, users, clients]); 
  
  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, [fetchUsers, fetchClients]);

  useEffect(() => {
     if (users.length > 0 && invoices.length > 0 && clients.length > 0) { 
      fetchRoutes();
    }
  }, [users, invoices, clients, fetchRoutes]);


  useEffect(() => {
    if (loggedInUser) {
      if (loggedInUser.role === 'repartidor') {
        fetchInvoices({ assigneeId: loggedInUser.id, status: 'LISTO_PARA_RUTA' }); 
      } else if (loggedInUser.role === 'supervisor' || loggedInUser.role === 'administrador' || loggedInUser.role === 'bodega') {
        fetchInvoices(); 
        setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY);
        setSelectedStatusBySupervisor(null);
        setSearchTerm('');
      }
    } else {
      setInvoices([]);
      setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY);
      setSelectedStatusBySupervisor(null);
      setSearchTerm('');
    }
  }, [loggedInUser, fetchInvoices]);


  const handleLogin = async () => {
    if (!usernameInput.trim() || !passwordInput.trim()) { 
      toast({ variant: "destructive", title: "Error", description: "Por favor, ingresa tu nombre de usuario y contraseña." });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: usernameInput.trim(), password: passwordInput.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error de inicio de sesión');
      }
      
      login(data as User); 
      toast({ title: "Sesión Iniciada", description: `Bienvenido ${data.name}.` });
      setUsernameInput('');
      setPasswordInput('');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error de Inicio de Sesión", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    toast({ title: "Sesión Cerrada", description: `Hasta luego ${loggedInUser?.name}.` });
    logout();
    setUsernameInput('');
    setPasswordInput('');
  };

  const handleProcessInvoiceClick = (invoiceId: string) => {
    const invoiceToProcess = invoices.find(inv => inv.id === invoiceId);
    if (invoiceToProcess) {
      setProcessingInvoice(invoiceToProcess);
      setIsProcessDialogOpen(true);
    }
  };

  const handleAddInvoiceClick = () => {
    setInvoiceToEdit(null);
    setIsAddEditInvoiceDialogOpen(true);
  };

  const handleEditInvoiceClick = (invoiceId: string) => {
    const invoiceToEditDetails = invoices.find(inv => inv.id === invoiceId);
    if (invoiceToEditDetails) {
      setInvoiceToEdit(invoiceToEditDetails);
      setIsAddEditInvoiceDialogOpen(true);
    }
  };

  const handleSaveInvoice = async (invoiceData: InvoiceFormData, id?: string) => {
    setIsLoading(true);
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/invoices/${id}` : '/api/invoices';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      const savedInvoice = await response.json();
      if (!response.ok) {
        throw new Error(savedInvoice.error || 'Error al guardar factura');
      }
      
      // Populate client and assignee details for immediate UI update if needed
      const currentAssigneeUser = users.find(u => u.id === savedInvoice.assigneeId);
      const assigneeDetailsForState = currentAssigneeUser ? { id: currentAssigneeUser.id, name: currentAssigneeUser.name } : null;
      const currentClient = clients.find(c => c.id === savedInvoice.clientId);

      const fullyPopulatedInvoice = {
        ...savedInvoice,
        assignee: assigneeDetailsForState,
        client: currentClient || null,
      };

      if (id) { 
        setInvoices(prevInvoices =>
          prevInvoices.map(inv => (inv.id === id ? fullyPopulatedInvoice : inv))
        );
        toast({ title: "Factura Actualizada", description: `La factura #${savedInvoice.invoiceNumber} ha sido actualizada.` });
      } else { 
        setInvoices(prevInvoices => [fullyPopulatedInvoice, ...prevInvoices].sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
        toast({ title: "Factura Agregada", description: `La factura #${savedInvoice.invoiceNumber} ha sido agregada.` });
      }
      setIsAddEditInvoiceDialogOpen(false);
      fetchRoutes(); 
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Guardar Factura', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInvoiceStatus = async (
    invoiceId: string, 
    newStatus: InvoiceStatus, 
    cancellationReason?: string, 
    deliveryNotes?: string,
    incidencePayload?: {
        type: IncidenceType;
        details: string;
        reportedAt: string;
        requiresAction: boolean;
    } | { 
        type: null;
        details: null;
        reportedAt: null;
        requiresAction: false;
    }
  ) => {
    setIsLoading(true);
    try {
      const payload: any = { status: newStatus };
      if (deliveryNotes !== undefined) payload.deliveryNotes = deliveryNotes;
      if (newStatus === 'CANCELADA') payload.cancellationReason = cancellationReason;
      
      if (incidencePayload) {
        payload.incidenceType = incidencePayload.type;
        payload.incidenceDetails = incidencePayload.details;
        payload.incidenceReportedAt = incidencePayload.reportedAt;
        payload.incidenceRequiresAction = incidencePayload.requiresAction;
      }

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updatedInvoice = await response.json();
      if (!response.ok) {
        throw new Error(updatedInvoice.error || 'Error al actualizar estado');
      }
      
      // Repopulate for UI consistency
      const currentAssigneeUser = users.find(u => u.id === updatedInvoice.assigneeId);
      const assigneeDetailsForState = currentAssigneeUser ? { id: currentAssigneeUser.id, name: currentAssigneeUser.name } : null;
      const currentClient = clients.find(c => c.id === updatedInvoice.clientId);
       const fullyPopulatedInvoice = {
        ...updatedInvoice,
        assignee: assigneeDetailsForState,
        client: currentClient || null,
      };

      setInvoices(prevInvoices =>
        prevInvoices.map(inv => (inv.id === invoiceId ? fullyPopulatedInvoice : inv))
      );
      
      toast({ title: 'Estado Actualizado', description: `La factura #${updatedInvoice.invoiceNumber || invoiceId} ha sido actualizada a ${newStatus.toLowerCase().replace(/_/g, ' ')}.`});
      if (incidencePayload && incidencePayload.requiresAction && (loggedInUser?.role === 'supervisor' || loggedInUser?.role === 'administrador')) {
        toast({
            title: "ALERTA DE INCIDENCIA",
            description: `Nueva incidencia (${incidencePayload.type}) reportada para factura ${updatedInvoice.invoiceNumber}. Requiere su atención.`,
            variant: "destructive",
            duration: 10000, 
        });
      }
      setIsProcessDialogOpen(false); 
      fetchRoutes(); 
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Actualizar Estado', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenAddRepartidorDialog = () => {
    setRepartidorToEditFromSupervisor(null);
    setIsAddRepartidorDialogOpen(true);
  };

  const handleOpenEditRepartidorDialog = (repartidor: User) => {
    setRepartidorToEditFromSupervisor(repartidor);
    setIsAddRepartidorDialogOpen(true);
  };

  const handleSaveRepartidorBySupervisor = async (name: string, idToEdit?: string, password?: string) => {
    await handleSaveUser({ name, role: 'repartidor' as UserRole, password }, idToEdit, true); 
  };


  const handleOpenDeleteRepartidorDialog = (repartidor: User) => {
    setRepartidorToDelete(repartidor);
    setIsConfirmDeleteRepartidorOpen(true);
  };

  const executeDeleteRepartidorBySupervisor = async () => {
    if (!repartidorToDelete) return;
    await executeDeleteUser(repartidorToDelete, true); 
  };


  const handleOpenAddUserDialog = () => {
    setUserToEdit(null);
    setIsAddEditUserDialogOpen(true);
  };

  const handleOpenEditUserDialog = (user: User) => {
    setUserToEdit(user);
    setIsAddEditUserDialogOpen(true);
  };

  const handleOpenDeleteUserDialog = (user: User) => {
    if (loggedInUser && user.id === loggedInUser.id) {
      toast({ variant: "destructive", title: "Operación no permitida", description: "No puedes eliminarte a ti mismo." });
      return;
    }
    setUserToDelete(user);
    setIsConfirmDeleteUserOpen(true);
  };

  const handleSaveUser = async (userData: { name: string; role: UserRole; password?: string }, idToEdit?: string, isSupervisorAction: boolean = false) => {
    setIsLoading(true);
    const method = idToEdit ? 'PUT' : 'POST';
    const endpoint = idToEdit ? `/api/users/${idToEdit}` : '/api/users';
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const savedUser = await response.json();
      if (!response.ok) {
        throw new Error(savedUser.error || 'Error al guardar usuario');
      }

      if (idToEdit) { 
        setUsers(prevUsers => prevUsers.map(u => (u.id === idToEdit ? savedUser : u)));
      } else { 
        setUsers(prevUsers => [savedUser, ...prevUsers]);
      }
      
      const actionText = isSupervisorAction ? (idToEdit ? 'Repartidor Actualizado' : 'Repartidor Agregado') : (idToEdit ? 'Usuario Actualizado' : 'Usuario Agregado');
      const descriptionText = isSupervisorAction 
        ? (idToEdit ? `El repartidor ${savedUser.name} ha sido actualizado.` : `El repartidor ${savedUser.name} ha sido agregado.`)
        : (idToEdit ? `Los datos de ${savedUser.name} han sido actualizados.` : `El usuario ${savedUser.name} (${savedUser.role}) ha sido agregado.`);
      
      toast({ title: actionText, description: descriptionText });
      
      if (isSupervisorAction) setIsAddRepartidorDialogOpen(false);
      else setIsAddEditUserDialogOpen(false);
      fetchRoutes(); 
      
    } catch (error: any) {
      toast({ variant: 'destructive', title: isSupervisorAction ? 'Error al Guardar Repartidor' : 'Error al Guardar Usuario', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const executeDeleteUser = async (userToDeleteParam?: User, isSupervisorAction: boolean = false) => {
    const targetUser = userToDeleteParam || userToDelete;
    if (!targetUser) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${targetUser.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error al eliminar usuario: ${response.statusText}`);
      }

      setUsers(prevUsers => prevUsers.filter(u => u.id !== targetUser.id));
      
      if (targetUser.role === 'repartidor') {
        // After deleting a repartidor, refetch invoices to update their assignee status
        fetchInvoices( (loggedInUser?.role === 'repartidor' && loggedInUser.id === targetUser.id) 
          ? {} // If deleting self as repartidor, fetch all relevant invoices for current view
          : { assigneeId: selectedRepartidorIdBySupervisor === targetUser.id ? '' : selectedRepartidorIdBySupervisor || '', status: selectedStatusBySupervisor || '' }
        );
        setRoutes(prevRoutes => prevRoutes.filter(r => r.repartidorId !== targetUser.id));
        if (selectedRepartidorIdBySupervisor === targetUser.id) {
          setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY);
        }
      }

      const titleText = isSupervisorAction ? 'Repartidor Eliminado' : 'Usuario Eliminado';
      const descriptionText = isSupervisorAction 
        ? `El repartidor ${targetUser.name} ha sido eliminado.`
        : `El usuario ${targetUser.name} ha sido eliminado.`;

      toast({ title: titleText, description: descriptionText });
      
      if (isSupervisorAction) {
        setRepartidorToDelete(null);
        setIsConfirmDeleteRepartidorOpen(false);
      } else {
        setUserToDelete(null);
        setIsConfirmDeleteUserOpen(false);
      }
      fetchRoutes(); 
    } catch (error: any) {
      toast({ variant: 'destructive', title: isSupervisorAction ? 'Error al Eliminar Repartidor' : 'Error al Eliminar Usuario', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddClientDialog = () => {
    setClientToEdit(null);
    setIsAddEditClientDialogOpen(true);
  };

  const handleOpenEditClientDialog = (client: Client) => {
    setClientToEdit(client);
    setIsAddEditClientDialogOpen(true);
  };
  
  const handleOpenDeleteClientDialog = (client: Client) => {
    setClientToDelete(client);
    setIsConfirmDeleteClientOpen(true);
  };

  const handleSaveClient = async (clientData: ClientFormData, id?: string) => {
    setIsLoading(true);
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/clients/${id}` : '/api/clients';
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });
      const savedClient = await response.json();
      if (!response.ok) {
        throw new Error(savedClient.error || 'Error al guardar cliente');
      }

      if (id) {
        setClients(prevClients => 
          prevClients.map(c => c.id === id ? savedClient : c)
        );
        toast({ title: "Cliente Actualizado", description: `El cliente ${savedClient.name} ha sido actualizado.` });
      } else {
        setClients(prevClients => [savedClient, ...prevClients].sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
        toast({ title: "Cliente Agregado", description: `El cliente ${savedClient.name} ha sido agregado.` });
      }
      setIsAddEditClientDialogOpen(false);
      setIsManageClientsDialogOpen(true); 
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error al Guardar Cliente', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const executeDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsLoading(true);
    try {
        const response = await fetch(`/api/clients/${clientToDelete.id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error al eliminar cliente: ${response.statusText}`);
        }
        setClients(prevClients => prevClients.filter(c => c.id !== clientToDelete.id));
        // Refetch invoices as some might have been associated with this client
        fetchInvoices(); 
        toast({ title: "Cliente Eliminado", description: `El cliente ${clientToDelete.name} ha sido eliminado.`});
        setClientToDelete(null);
        setIsConfirmDeleteClientOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error al Eliminar Cliente', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleOpenManageRoutesDialog = () => {
    setSelectedDateForRoutesDialog(startOfDay(new Date())); 
    setIsManageRoutesDialogOpen(true);
  };
  
  const handleOpenAddRouteDialog = (date: Date) => {
    setRouteToEdit(null);
    setSelectedDateForRoutesDialog(startOfDay(date));
    setIsAddEditRouteDialogOpen(true);
  };

  const handleOpenEditRouteDialog = (route: Route) => {
    setRouteToEdit(route);
    setSelectedDateForRoutesDialog(startOfDay(parseISO(route.date)));
    setIsAddEditRouteDialogOpen(true);
  };

  const handleSaveRoute = async (routeData: RouteFormData, id?: string) => {
    setIsLoading(true);
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/routes/${id}` : '/api/routes';
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeData),
      });
      const savedRoute = await response.json();
      if (!response.ok) {
        throw new Error(savedRoute.error || 'Error al guardar ruta');
      }
      
      // After saving a route, refetch invoices and routes as associations might have changed
      await fetchInvoices(); 
      await fetchRoutes(); 
      // Local state update is tricky due to potential invoice re-assignments. Fetching is safer.

      const repartidor = users.find(u => u.id === savedRoute.repartidorId);
      if (id) { 
        toast({ title: "Ruta Actualizada", description: `Ruta para ${repartidor?.name || 'desconocido'} el ${formatISO(parseISO(savedRoute.date), { representation: 'date' })} actualizada.` });
      } else { 
        toast({ title: "Ruta Creada", description: `Nueva ruta creada para ${repartidor?.name || 'desconocido'} el ${formatISO(parseISO(savedRoute.date), { representation: 'date' })}.` });
      }
      setIsAddEditRouteDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Guardar Ruta', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getAssigneeName = (assigneeId?: string | null): string | undefined => {
    if (!assigneeId) return undefined;
    const repartidor = users.find(u => u.id === assigneeId && u.role === 'repartidor');
    if (repartidor) return repartidor.name;
    
    const currentInvoice = processingInvoice || invoiceToEdit;
    if (currentInvoice?.assignee?.id === assigneeId) {
        return currentInvoice.assignee.name;
    }
    const user = users.find(u => u.id === assigneeId);
    return user?.name; 
  };


  const repartidores = useMemo(() => users.filter(user => user.role === 'repartidor'), [users]);

  const displayedInvoices = useMemo(() => {
    if (!loggedInUser) return [];

    let filteredInvoices = [...invoices]; 

    if (loggedInUser.role === 'supervisor' || loggedInUser.role === 'administrador') {
      if (searchTerm.trim()) {
        const lowerSearchTerm = searchTerm.trim().toLowerCase();
        filteredInvoices = filteredInvoices.filter(inv =>
          inv.supplierName.toLowerCase().includes(lowerSearchTerm) ||
          inv.invoiceNumber.toLowerCase().includes(lowerSearchTerm) ||
          (inv.client?.name && inv.client.name.toLowerCase().includes(lowerSearchTerm)) ||
          (inv.uniqueCode && inv.uniqueCode.toLowerCase().includes(lowerSearchTerm))
        );
      }

      if (selectedStatusBySupervisor === INCIDENCES_KEY) {
        filteredInvoices = filteredInvoices.filter(inv => inv.incidenceRequiresAction === true);
      } else if (selectedStatusBySupervisor) {
        filteredInvoices = filteredInvoices.filter(inv => inv.status === selectedStatusBySupervisor);
      }

      if (selectedRepartidorIdBySupervisor === UNASSIGNED_KEY) {
        filteredInvoices = filteredInvoices.filter(inv => !inv.assigneeId);
      } else if (selectedRepartidorIdBySupervisor && selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY) {
        filteredInvoices = filteredInvoices.filter(inv => inv.assigneeId === selectedRepartidorIdBySupervisor);
      }
      return filteredInvoices.sort((a, b) => new Date(b.updatedAt || b.createdAt!).getTime() - new Date(a.updatedAt || a.createdAt!).getTime());

    }

    if (loggedInUser.role === 'repartidor') {
      const repartidorRoutes = routes.filter(r => r.repartidorId === loggedInUser.id);
      const invoiceIdsInRepartidorRoutes = repartidorRoutes.flatMap(r => r.invoiceIds);
      
      return invoices.filter(inv => 
        (inv.status === 'LISTO_PARA_RUTA' && inv.assigneeId === loggedInUser.id) || 
        (inv.status === 'LISTO_PARA_RUTA' && invoiceIdsInRepartidorRoutes.includes(inv.id)) 
      ).sort((a, b) => {
        try {
          const dateA = a.date ? parseISO(a.date).getTime() : 0;
          const dateB = b.date ? parseISO(b.date).getTime() : 0;
          if (dateA !== dateB) return dateA - dateB;
          return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
        } catch {
           return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
        }
      });
    }

    if (loggedInUser.role === 'bodega') {
      const relevantInvoices = invoices.filter(inv => {
        const routeOfInvoice = routes.find(r => r.id === inv.routeId);
        const isPendingOnPlannedRoute = inv.status === 'PENDIENTE' && routeOfInvoice?.status === 'PLANNED';
        return isPendingOnPlannedRoute || inv.status === 'EN_PREPARACION' || inv.status === 'INCIDENCIA_BODEGA';
      });
      
      return relevantInvoices.map(inv => {
        const route = routes.find(r => r.id === inv.routeId);
        const repartidorName = route ? users.find(u => u.id === route.repartidorId)?.name : undefined;
        return { ...inv, repartidorNameForRoute: repartidorName };
      }).sort((a, b) => {
        const routeA = routes.find(r => r.id === a.routeId);
        const routeB = routes.find(r => r.id === b.routeId);
    
        if (routeA?.date && routeB?.date) {
          try {
            const dateComparison = parseISO(routeA.date).getTime() - parseISO(routeB.date).getTime();
            if (dateComparison !== 0) return dateComparison;
          } catch (e) {  /* ignore date parse error for sorting */ }
        } else if (routeA?.date) {
          return -1; 
        } else if (routeB?.date) {
          return 1;  
        }
    
        const repartidorNameA = (a as any).repartidorNameForRoute;
        const repartidorNameB = (b as any).repartidorNameForRoute;
        if (repartidorNameA && repartidorNameB) {
          const repartidorComparison = repartidorNameA.localeCompare(repartidorNameB);
          if (repartidorComparison !== 0) return repartidorComparison;
        } else if (repartidorNameA) {
          return -1;
        } else if (repartidorNameB) {
          return 1;
        }
    
        try {
          const timeA = a.date ? parseISO(a.date).getTime() : 0;
          const timeB = b.date ? parseISO(b.date).getTime() : 0;
          if (timeA !== 0 && timeB !== 0 && timeA !== timeB) return timeA - timeB;
          if (timeA !== 0) return -1;
          if (timeB !== 0) return 1;
        } catch (e) { /* ignore date parse error for sorting */ }
        
        return (a.id || '').localeCompare(b.id || '');
      });
    }
    return [];
  }, [loggedInUser, invoices, selectedRepartidorIdBySupervisor, selectedStatusBySupervisor, searchTerm, routes, users]);


  const getInvoicesTitleForSupervisorOrAdmin = () => {
    let titleParts: string[] = [];
    let baseTitle = "Facturas";

    if (searchTerm.trim()) {
      titleParts.push(`Resultados para "${searchTerm.trim()}"`);
    }
    
    let statusDescription = "Todos los Estados";
    if (selectedStatusBySupervisor === INCIDENCES_KEY) {
        statusDescription = "Facturas con Incidencias Pendientes";
    } else if (selectedStatusBySupervisor) {
        const statusDetail = statusCardDetails[selectedStatusBySupervisor as InvoiceStatus];
        statusDescription = statusDetail ? statusDetail.label : `Facturas ${selectedStatusBySupervisor.toLowerCase().replace(/_/g, ' ')}`;
    }


    let repartidorDescription = "Todas las Facturas";
    if (selectedRepartidorIdBySupervisor === UNASSIGNED_KEY) {
        repartidorDescription = "Facturas sin Asignar";
    } else if (selectedRepartidorIdBySupervisor && selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY) {
        const repartidor = users.find(u => u.id === selectedRepartidorIdBySupervisor);
        if (repartidor) {
            repartidorDescription = `Asignadas a: ${repartidor.name}`;
        } else {
           repartidorDescription = "Repartidor no encontrado";
        }
    }

    if (searchTerm.trim()) {
        let specifics = [];
        if (selectedStatusBySupervisor) specifics.push(statusDescription.toLowerCase());
        if (selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY && selectedRepartidorIdBySupervisor !== UNASSIGNED_KEY) specifics.push(repartidorDescription.toLowerCase());
        else if (selectedRepartidorIdBySupervisor === UNASSIGNED_KEY) specifics.push("sin asignar");


        if (specifics.length > 0) {
          return `${titleParts[0]} (${specifics.join(', ')})`;
        }
        return titleParts[0];
    }

    if (selectedStatusBySupervisor && selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY) {
        return `${statusDescription} (${repartidorDescription})`;
    }
    if (selectedStatusBySupervisor) {
        return statusDescription;
    }
    if (selectedRepartidorIdBySupervisor !== ALL_REPARTIDORES_KEY) {
        return repartidorDescription;
    }

    return baseTitle;
  };


  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!loggedInUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader loggedInUser={null} onLogout={() => {}} />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-semibold text-foreground">Iniciar Sesión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                <div>
                  <Label htmlFor="username-login" className="mb-2 block text-sm font-medium text-foreground">
                    Nombre de Usuario:
                  </Label>
                  <Input
                    id="username-login"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Ej: admin / sup / john / bodeguero"
                    required
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="password-login" className="mb-2 block text-sm font-medium text-foreground">
                    Contraseña:
                  </Label>
                  <Input
                    id="password-login"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Ej: 123"
                    required
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Ingresando...' : <><LogIn className="mr-2 h-5 w-5" /> Entrar</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
        <footer className="py-6 text-center text-sm text-muted-foreground border-t">
          © 2025 SnapClaim. All rights reserved.
        </footer>
        <Toaster />
      </div>
    );
  }

  const isSupervisor = loggedInUser.role === 'supervisor';
  const isAdmin = loggedInUser.role === 'administrador';
  const isSupervisorOrAdmin = isSupervisor || isAdmin;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader loggedInUser={loggedInUser} onLogout={handleLogout} />
        <div className="flex flex-1">
          {loggedInUser && <AppSidebar />}
          <SidebarInset>
            <main className="flex-grow container mx-auto px-4 py-8">
              {isSupervisorOrAdmin && (
                <section className="space-y-8">
                  <div>
                    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                      <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                        {isAdmin ? 'Panel de Administrador' : 'Panel de Supervisor'}
                      </h2>
                      <div className="flex gap-2 flex-wrap">
                        <Button onClick={handleOpenManageRoutesDialog} variant="outline" disabled={isLoading}>
                            <MapIcon className="mr-2 h-4 w-4" />
                            Gestionar Rutas
                        </Button>
                        <Button onClick={handleAddInvoiceClick} disabled={isLoading}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Agregar Factura
                        </Button>
                         <Button onClick={() => setIsManageClientsDialogOpen(true)} variant="outline" disabled={isLoading}>
                            <BuildingIcon className="mr-2 h-4 w-4" />
                            Gestionar Clientes
                          </Button>
                        {isSupervisor && !isAdmin && (
                          <>
                            <Button onClick={handleOpenAddRepartidorDialog} variant="outline" disabled={isLoading}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Agregar Repartidor
                            </Button>
                            <Button onClick={() => setIsManageRepartidoresOpen(true)} variant="outline" disabled={isLoading || repartidores.length === 0}>
                              <Settings2 className="mr-2 h-4 w-4" />
                              Gestionar Repartidores
                            </Button>
                          </>
                        )}
                        {isAdmin && (
                          <>
                            <Button onClick={handleOpenAddUserDialog} variant="outline" disabled={isLoading}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Agregar Usuario
                            </Button>
                             <Button onClick={() => setIsManageAllUsersDialogOpen(true)} variant="outline" disabled={isLoading || users.length === 0}>
                              <UsersIconLucide className="mr-2 h-4 w-4" />
                              Gestionar Usuarios
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <Card className="shadow-sm border">
                          <AccordionTrigger className="w-full p-0 hover:no-underline">
                            <CardHeader className="flex-1">
                                <CardTitle className="text-lg flex items-center w-full">
                                  <div className="flex items-center gap-2">
                                    <Filter className="h-5 w-5 text-primary" />
                                    Opciones de Filtrado y Búsqueda de Facturas
                                  </div>
                                </CardTitle>
                            </CardHeader>
                          </AccordionTrigger>
                          <AccordionContent>
                            <CardContent className="pt-2 space-y-6">
                                <div className="relative">
                                  <Label htmlFor="search-invoices" className="sr-only">Buscar facturas</Label>
                                  <Input
                                    id="search-invoices"
                                    type="text"
                                    placeholder="Buscar por proveedor, N° factura, cliente o código..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full"
                                    disabled={isLoading}
                                  />
                                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                </div>

                                <div>
                                  <h3 className="text-base font-medium text-foreground mb-3">Filtrar Facturas por Estado:</h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {invoiceStatusesArray.map(status => {
                                      const details = statusCardDetails[status];
                                      return (
                                        <Card
                                          key={status}
                                          className={cn(
                                            "cursor-pointer transition-shadow",
                                            selectedStatusBySupervisor === status ? 'ring-2 ring-primary shadow-md' : 'border hover:shadow-md',
                                            isLoading && 'opacity-50 cursor-not-allowed'
                                          )}
                                          onClick={() => !isLoading && setSelectedStatusBySupervisor(prev => prev === status ? null : status)}
                                        >
                                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                                            <CardTitle className="text-xs font-medium">{details.label}</CardTitle>
                                            <details.Icon className="h-4 w-4 text-muted-foreground" />
                                          </CardHeader>
                                          <CardContent className="px-3 pb-2">
                                            <p className="text-xs text-muted-foreground">{details.description}</p>
                                          </CardContent>
                                        </Card>
                                      );
                                    })}
                                     <Card
                                      key={INCIDENCES_KEY}
                                      className={cn(
                                          "cursor-pointer transition-shadow",
                                          selectedStatusBySupervisor === INCIDENCES_KEY ? 'ring-2 ring-amber-500 shadow-md border-amber-400' : 'border hover:shadow-md',
                                          isLoading && 'opacity-50 cursor-not-allowed'
                                      )}
                                      onClick={() => !isLoading && setSelectedStatusBySupervisor(prev => prev === INCIDENCES_KEY ? null : INCIDENCES_KEY)}
                                      >
                                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                                          <CardTitle className="text-xs font-medium text-amber-700">Con Incidencias</CardTitle>
                                          <FileWarning className="h-4 w-4 text-amber-600" />
                                      </CardHeader>
                                      <CardContent className="px-3 pb-2">
                                          <p className="text-xs text-muted-foreground">Requieren atención</p>
                                      </CardContent>
                                      </Card>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => !isLoading && setSelectedStatusBySupervisor(null)}
                                      className={cn(
                                        "h-full whitespace-normal text-left justify-start items-center transition-shadow hover:shadow-md text-xs py-2 px-3",
                                        !selectedStatusBySupervisor ? 'ring-2 ring-primary shadow-md' : 'hover:bg-background hover:text-foreground',
                                         isLoading && 'opacity-50 cursor-not-allowed'
                                      )}
                                      disabled={isLoading}
                                    >
                                      <ListFilter className="mr-2 h-3 w-3" />
                                      Mostrar Todos los Estados
                                    </Button>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="text-base font-medium text-foreground mb-3">Filtrar Facturas por Repartidor:</h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                      <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => !isLoading && setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY)}
                                          className={cn(
                                            "h-full whitespace-normal text-left justify-start items-center transition-shadow hover:shadow-md text-xs py-2 px-3",
                                            selectedRepartidorIdBySupervisor === ALL_REPARTIDORES_KEY ? 'ring-2 ring-primary shadow-md' : 'hover:bg-background hover:text-foreground',
                                            isLoading && 'opacity-50 cursor-not-allowed'
                                          )}
                                          disabled={isLoading}
                                        >
                                          <Users className="mr-2 h-3 w-3" />
                                          Mostrar Todas las Facturas
                                      </Button>

                                      {repartidores.map(repartidor => (
                                        <Card
                                          key={repartidor.id}
                                          className={cn(
                                              "cursor-pointer transition-shadow",
                                              selectedRepartidorIdBySupervisor === repartidor.id ? 'ring-2 ring-primary shadow-md' : 'border hover:shadow-md',
                                              isLoading && 'opacity-50 cursor-not-allowed'
                                          )}
                                          onClick={() => !isLoading && setSelectedRepartidorIdBySupervisor(prev => prev === repartidor.id ? ALL_REPARTIDORES_KEY : repartidor.id)}
                                        >
                                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                                            <CardTitle className="text-xs font-medium">{repartidor.name}</CardTitle>
                                            <UserSquare2 className="h-4 w-4 text-muted-foreground" />
                                          </CardHeader>
                                          <CardContent className="px-3 pb-2">
                                            <div className="text-xs text-muted-foreground">Rol: repartidor</div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                      <Card
                                        key={UNASSIGNED_KEY}
                                        className={cn(
                                          "cursor-pointer transition-shadow",
                                          selectedRepartidorIdBySupervisor === UNASSIGNED_KEY ? 'ring-2 ring-primary shadow-md' : 'border hover:shadow-md',
                                           isLoading && 'opacity-50 cursor-not-allowed'
                                        )}
                                        onClick={() => !isLoading && setSelectedRepartidorIdBySupervisor(prev => prev === UNASSIGNED_KEY ? ALL_REPARTIDORES_KEY : UNASSIGNED_KEY)}
                                      >
                                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                                          <CardTitle className="text-xs font-medium">Facturas sin Asignar</CardTitle>
                                          <Archive className="h-4 w-4 text-muted-foreground" />
                                          </CardHeader>
                                          <CardContent className="px-3 pb-2">
                                          <div className="text-xs text-muted-foreground">Ver no asignadas</div>
                                          </CardContent>
                                      </Card>
                                      {repartidores.length === 0 && !isLoading && (
                                           <p className="text-muted-foreground mt-2 text-sm p-2 md:col-span-4 text-center">No hay repartidores. Agrega uno para asignar facturas.</p>
                                      )}
                                  </div>
                                </div>
                              </CardContent>
                            </AccordionContent>
                          </Card>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground my-6">
                      {getInvoicesTitleForSupervisorOrAdmin()}
                    </h3>
                    {isLoading && displayedInvoices.length === 0 && <p className="text-muted-foreground">Cargando facturas...</p>}
                    {!isLoading && displayedInvoices.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedInvoices.map(invoice => (
                          <InvoiceCard
                            key={invoice.id}
                            invoice={invoice}
                            onAction={isAdmin || isSupervisor ? handleEditInvoiceClick : undefined}
                            currentUserRole={loggedInUser?.role}
                            assigneeName={invoice.assignee?.name || getAssigneeName(invoice.assigneeId)}
                            clientName={invoice.client?.name}
                          />
                        ))}
                      </div>
                    ) : (
                      !isLoading && <p className="text-muted-foreground">
                        {searchTerm.trim() ? `No se encontraron facturas para "${searchTerm.trim()}" con los filtros seleccionados.` : `No se encontraron facturas que coincidan con los filtros seleccionados.`}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {loggedInUser.role === 'repartidor' && (
                 <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Mis Facturas Listas para Ruta</h2>
                  {isLoading && displayedInvoices.length === 0 && <p className="text-muted-foreground">Cargando tus facturas...</p>}
                  {!isLoading && displayedInvoices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedInvoices.map(invoice => (
                        <InvoiceCard
                          key={invoice.id}
                          invoice={invoice}
                          onAction={handleProcessInvoiceClick}
                          currentUserRole={loggedInUser?.role}
                          clientName={invoice.client?.name}
                        />
                      ))}
                    </div>
                  ) : (
                   !isLoading && <p className="text-muted-foreground">No tienes facturas listas para ruta asignadas.</p>
                  )}
                </section>
              )}

              {loggedInUser.role === 'bodega' && (
                 <section>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground flex items-center">
                    <Warehouse className="mr-3 h-7 w-7 text-primary" />
                    Panel de Bodega - Facturas para Preparar
                  </h2>
                  {isLoading && displayedInvoices.length === 0 && <p className="text-muted-foreground">Cargando facturas...</p>}
                  {!isLoading && displayedInvoices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {displayedInvoices.map(invoice => (
                        <InvoiceCard
                          key={invoice.id}
                          invoice={invoice}
                          onUpdateStatus={handleUpdateInvoiceStatus}
                          currentUserRole={loggedInUser?.role}
                          clientName={invoice.client?.name}
                          assigneeName={invoice.assignee?.name} 
                          repartidorNameForRoute={(invoice as any).repartidorNameForRoute}
                        />
                      ))}
                    </div>
                  ) : (
                   !isLoading && <p className="text-muted-foreground">No hay facturas pendientes de preparación en rutas planificadas o con incidencias.</p>
                  )}
                </section>
              )}
            </main>
          </SidebarInset>
        </div>
        <footer className="py-6 text-center text-sm text-muted-foreground border-t">
          © 2025 SnapClaim. All rights reserved.
        </footer>
      </div>

      <ProcessInvoiceDialog
        isOpen={isProcessDialogOpen}
        onOpenChange={setIsProcessDialogOpen}
        invoice={processingInvoice}
        onUpdateStatus={handleUpdateInvoiceStatus}
      />
      <AddEditInvoiceDialog
        isOpen={isAddEditInvoiceDialogOpen}
        onOpenChange={setIsAddEditInvoiceDialogOpen}
        invoiceToEdit={invoiceToEdit}
        users={repartidores} 
        clients={clients}
        onSave={handleSaveInvoice}
        allRoutes={routes}
      />

      {isSupervisorOrAdmin && (
        <>
            <AddEditClientDialog
                isOpen={isAddEditClientDialogOpen}
                onOpenChange={setIsAddEditClientDialogOpen}
                clientToEdit={clientToEdit}
                onSave={handleSaveClient}
            />
            <ManageClientsDialog
                isOpen={isManageClientsDialogOpen}
                onOpenChange={setIsManageClientsDialogOpen}
                clients={clients}
                onAddClient={handleOpenAddClientDialog}
                onEditClient={handleOpenEditClientDialog}
                onDeleteClient={handleOpenDeleteClientDialog}
            />
            {clientToDelete && (
                 <ConfirmDialog
                    isOpen={isConfirmDeleteClientOpen}
                    onOpenChange={setIsConfirmDeleteClientOpen}
                    title={`Confirmar Eliminación de ${clientToDelete.name}`}
                    description={`¿Estás seguro de que quieres eliminar al cliente ${clientToDelete.name}? Esta acción no se puede deshacer. Las facturas asociadas a este cliente se desvincularán.`}
                    onConfirm={executeDeleteClient}
                    confirmButtonText="Eliminar Cliente"
                />
            )}
            <ManageRoutesDialog
                isOpen={isManageRoutesDialogOpen}
                onOpenChange={setIsManageRoutesDialogOpen}
                routes={routes}
                repartidores={repartidores}
                invoices={invoices}
                onAddRoute={handleOpenAddRouteDialog}
                onEditRoute={handleOpenEditRouteDialog}
                selectedDate={selectedDateForRoutesDialog}
                onDateChange={setSelectedDateForRoutesDialog}
            />
            <AddEditRouteDialog
                isOpen={isAddEditRouteDialogOpen}
                onOpenChange={setIsAddEditRouteDialogOpen}
                routeToEdit={routeToEdit}
                repartidores={repartidores}
                allInvoices={invoices}
                allRoutes={routes}
                onSave={handleSaveRoute}
                selectedDateForNewRoute={selectedDateForRoutesDialog}
            />
        </>
      )}


      {isSupervisor && !isAdmin && (
        <>
          <AddRepartidorDialog
            isOpen={isAddRepartidorDialogOpen}
            onOpenChange={setIsAddRepartidorDialogOpen}
            onSave={handleSaveRepartidorBySupervisor}
            repartidorToEdit={repartidorToEditFromSupervisor}
          />
          <ManageRepartidoresDialog
            isOpen={isManageRepartidoresOpen}
            onOpenChange={setIsManageRepartidoresOpen}
            repartidores={repartidores}
            onEdit={handleOpenEditRepartidorDialog}
            onDelete={handleOpenDeleteRepartidorDialog}
          />
          {repartidorToDelete && (
            <ConfirmDialog
                isOpen={isConfirmDeleteRepartidorOpen}
                onOpenChange={setIsConfirmDeleteRepartidorOpen}
                title={`Confirmar Eliminación de ${repartidorToDelete.name}`}
                description={`¿Estás seguro de que quieres eliminar a ${repartidorToDelete.name}? Esta acción no se puede deshacer. Las facturas asignadas a este repartidor pasarán a estar "Sin asignar", y las rutas asignadas serán eliminadas.`}
                onConfirm={executeDeleteRepartidorBySupervisor}
                confirmButtonText="Eliminar Repartidor"
            />
          )}
        </>
      )}

      {isAdmin && (
          <>
            <AddEditUserDialog
                isOpen={isAddEditUserDialogOpen}
                onOpenChange={setIsAddEditUserDialogOpen}
                userToEdit={userToEdit}
                onSave={handleSaveUser}
                availableRoles={manageableUserRoles} 
                currentUser={loggedInUser}
            />
            {userToDelete && (
                <ConfirmDialog
                    isOpen={isConfirmDeleteUserOpen}
                    onOpenChange={setIsConfirmDeleteUserOpen}
                    title={`Confirmar Eliminación de ${userToDelete.name}`}
                    description={`¿Estás seguro de que quieres eliminar a ${userToDelete.name} (${userToDelete.role})? Esta acción no se puede deshacer.${userToDelete.role === 'repartidor' ? ' Las facturas asignadas también se desasignarán y las rutas serán eliminadas.' : ''}`}
                    onConfirm={() => executeDeleteUser()}
                    confirmButtonText="Eliminar Usuario"
                />
            )}
            <ManageAllUsersDialog
                isOpen={isManageAllUsersDialogOpen}
                onOpenChange={setIsManageAllUsersDialogOpen}
                allUsers={users} 
                currentUser={loggedInUser} 
                onEdit={handleOpenEditUserDialog}
                onDelete={handleOpenDeleteUserDialog}
            />
          </>
      )}
      <Toaster />
    </SidebarProvider>
  );
}

    