
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


import type { AssignedInvoice, User, InvoiceFormData, InvoiceStatus, UserRole, Client, ClientFormData, Route, RouteFormData, RouteStatus } from '@/lib/types';
import { Toaster } from "@/components/ui/toaster";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, UserSquare2, Archive, UserPlus, LogIn, AlertTriangle, CheckCircle2, XCircle, ListFilter, Users, Search, Filter, Settings2, Users2 as UsersIconLucide, Building as BuildingIcon, MapIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import bcrypt from 'bcryptjs';
import { mockUsers, mockInvoices as initialMockInvoices, mockClients as initialMockClients, mockRoutes as initialMockRoutes } from '@/lib/mock-data';
import { formatISO, startOfDay, parseISO, isSameDay } from 'date-fns';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const UNASSIGNED_KEY = "unassigned_invoices_key";
const ALL_REPARTIDORES_KEY = "all_repartidores_filter_key";
const invoiceStatusesArray: InvoiceStatus[] = ['PENDIENTE', 'ENTREGADA', 'CANCELADA'];


const statusCardDetails: Record<InvoiceStatus, { label: string; Icon: React.ElementType; description: string }> = {
  PENDIENTE: { label: 'Facturas Pendientes', Icon: AlertTriangle, description: "Revisar y procesar" },
  ENTREGADA: { label: 'Facturas Entregadas', Icon: CheckCircle2, description: "Confirmadas y finalizadas" },
  CANCELADA: { label: 'Facturas Canceladas', Icon: XCircle, description: "Anuladas del sistema" },
};

const manageableUserRoles: UserRole[] = ['supervisor', 'repartidor']; 


export default function HomePage() {
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
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [invoices, setInvoices] = useState<AssignedInvoice[]>([]);
  const { toast } = useToast();

  const [selectedRepartidorIdBySupervisor, setSelectedRepartidorIdBySupervisor] = useState<string | null>(ALL_REPARTIDORES_KEY);
  const [selectedStatusBySupervisor, setSelectedStatusBySupervisor] = useState<InvoiceStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      setUsers(mockUsers.map(u => ({...u, role: u.role.toLowerCase() as UserRole })));
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Cargar Usuarios (Mock)', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      setClients(initialMockClients);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Cargar Clientes (Mock)', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUsersToUse = users.length > 0 ? users : mockUsers.map(u => ({...u, role: u.role.toLowerCase() as UserRole }));
      const currentInvoicesToUse = invoices.length > 0 ? invoices : initialMockInvoices;
      
      const populatedRoutes = initialMockRoutes.map(route => {
        const repartidor = currentUsersToUse.find(u => u.id === route.repartidorId);
        const routeInvoices = route.invoiceIds
          .map(id => currentInvoicesToUse.find(inv => inv.id === id))
          .filter(inv => inv !== undefined) as AssignedInvoice[];
        return {
          ...route,
          repartidorName: repartidor?.name,
          invoices: routeInvoices,
        };
      });
      setRoutes(populatedRoutes);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Cargar Rutas (Mock)', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast, users, invoices]);


  const fetchInvoices = useCallback(async (queryParams: Record<string, string> = {}) => {
    setIsLoading(true);
    try {
      let MOCK_INVOICES_TO_USE = [...initialMockInvoices]; 
      const status = queryParams.status as InvoiceStatus | null;
      const assigneeIdParam = queryParams.assigneeId;

      if (status) {
        MOCK_INVOICES_TO_USE = MOCK_INVOICES_TO_USE.filter(inv => inv.status === status);
      }
      if (assigneeIdParam) {
        MOCK_INVOICES_TO_USE = MOCK_INVOICES_TO_USE.filter(inv => inv.assigneeId === assigneeIdParam);
      }
      
      const currentUsers = users.length > 0 ? users : mockUsers.map(u => ({...u, role: u.role.toLowerCase() as UserRole }));
      const currentClients = clients.length > 0 ? clients : initialMockClients;

      const invoicesWithDetails = MOCK_INVOICES_TO_USE.map(inv => {
          const assignee = currentUsers.find(u => u.id === inv.assigneeId);
          const client = currentClients.find(c => c.id === inv.clientId);
          return {
              ...inv,
              assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
              client: client || null,
          };
      });

      setInvoices(invoicesWithDetails);
    } catch (error: any) {
      setInvoices([]);
      toast({ variant: 'destructive', title: 'Error al Cargar Facturas (Mock)', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast, users, clients]); 
  
  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, [fetchUsers, fetchClients]);

  useEffect(() => {
     if (users.length > 0 && invoices.length > 0) { // Fetch routes only after users and invoices are loaded
      fetchRoutes();
    }
  }, [users, invoices, fetchRoutes]);


  useEffect(() => {
    if (loggedInUser) {
      if (loggedInUser.role === 'repartidor') {
        fetchInvoices({ assigneeId: loggedInUser.id, status: 'PENDIENTE' });
      } else if (loggedInUser.role === 'supervisor' || loggedInUser.role === 'administrador') {
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
      const userToLogin = users.find(u => u.name === usernameInput.trim());
      if (!userToLogin || !userToLogin.password) {
        throw new Error('Credenciales inválidas');
      }
      const isPasswordValid = await bcrypt.compare(passwordInput.trim(), userToLogin.password);
      if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
      }
      
      setLoggedInUser(userToLogin); 
      toast({ title: "Sesión Iniciada", description: `Bienvenido ${userToLogin.name}.` });
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
    setLoggedInUser(null);
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
    try {
      const currentAssigneeUser = users.find(u => u.id === invoiceData.assigneeId);
      const assigneeDetailsForState = currentAssigneeUser ? { id: currentAssigneeUser.id, name: currentAssigneeUser.name } : null;
      const currentClient = clients.find(c => c.id === invoiceData.clientId);

      if (id) { 
        setInvoices(prevInvoices =>
          prevInvoices.map(inv =>
            inv.id === id ? { ...inv, ...invoiceData, id, assignee: assigneeDetailsForState, client: currentClient || null, updatedAt: new Date().toISOString() } : inv
          )
        );
        toast({ title: "Factura Actualizada (Mock)", description: `La factura #${invoiceData.invoiceNumber} ha sido actualizada.` });
      } else { 
        const newId = `mock-inv-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
        const newInvoice: AssignedInvoice = {
          ...invoiceData,
          id: newId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignee: assigneeDetailsForState,
          client: currentClient || null,
        };
        setInvoices(prevInvoices => [newInvoice, ...prevInvoices].sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
        toast({ title: "Factura Agregada (Mock)", description: `La factura #${newInvoice.invoiceNumber} ha sido agregada.` });
      }
      setIsAddEditInvoiceDialogOpen(false);
      fetchRoutes(); // Refresh routes in case invoice assignment changed
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Guardar Factura (Mock)', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: InvoiceStatus, cancellationReason?: string) => {
    setIsLoading(true);
    try {
      let updatedInvoiceNumber = '';
      setInvoices(prevInvoices =>
        prevInvoices.map(inv => {
          if (inv.id === invoiceId) {
            updatedInvoiceNumber = inv.invoiceNumber;
            return { ...inv, status: newStatus, cancellationReason: newStatus === 'CANCELADA' ? cancellationReason : undefined, updatedAt: new Date().toISOString() };
          }
          return inv;
        })
      );
      toast({ title: 'Estado Actualizado (Mock)', description: `La factura #${updatedInvoiceNumber || invoiceId} ha sido actualizada a ${newStatus.toLowerCase()}.`});
      setIsProcessDialogOpen(false); 
      fetchRoutes(); // Refresh routes as invoice status might affect availability
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Actualizar Estado (Mock)', description: error.message });
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
    try {
      if (idToEdit) { 
        let newHashedPassword = undefined;
        if (userData.password) {
            newHashedPassword = await bcrypt.hash(userData.password, 10);
        }
        setUsers(prevUsers => prevUsers.map(u => {
            if (u.id === idToEdit) {
                return {
                    ...u,
                    name: userData.name,
                    role: userData.role, 
                    ...(newHashedPassword && { password: newHashedPassword }), 
                    updatedAt: new Date().toISOString(),
                };
            }
            return u;
        }));
      } else { 
        const newUserId = `mock-user-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
        const hashedPassword = await bcrypt.hash(userData.password || 'defaultFallbackPass123', 10); 
        const newUserToAdd: User = {
          id: newUserId,
          name: userData.name,
          role: userData.role, 
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUsers(prevUsers => [newUserToAdd, ...prevUsers]);
      }
      
      const actionText = isSupervisorAction ? (idToEdit ? 'Repartidor Actualizado (Mock)' : 'Repartidor Agregado (Mock)') : (idToEdit ? 'Usuario Actualizado (Mock)' : 'Usuario Agregado (Mock)');
      const descriptionText = isSupervisorAction 
        ? (idToEdit ? `El repartidor ${userData.name} ha sido actualizado.` : `El repartidor ${userData.name} ha sido agregado.`)
        : (idToEdit ? `Los datos de ${userData.name} han sido actualizados.` : `El usuario ${userData.name} (${userData.role}) ha sido agregado.`);
      
      toast({ title: actionText, description: descriptionText });
      
      if (isSupervisorAction) setIsAddRepartidorDialogOpen(false);
      else setIsAddEditUserDialogOpen(false);
      fetchRoutes(); // Refresh routes if a repartidor was edited/added
      
    } catch (error: any) {
      toast({ variant: 'destructive', title: isSupervisorAction ? 'Error al Guardar Repartidor (Mock)' : 'Error al Guardar Usuario (Mock)', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const executeDeleteUser = async (userToDeleteParam?: User, isSupervisorAction: boolean = false) => {
    const targetUser = userToDeleteParam || userToDelete;
    if (!targetUser) return;
    setIsLoading(true);
    try {
      setUsers(prevUsers => prevUsers.filter(u => u.id !== targetUser.id));
      
      if (targetUser.role === 'repartidor') {
        setInvoices(prevInvoices => 
          prevInvoices.map(inv => 
            inv.assigneeId === targetUser.id 
              ? { ...inv, assigneeId: null, assignee: null, updatedAt: new Date().toISOString() } 
              : inv
          )
        );
        // Also remove or unassign routes associated with this repartidor
        setRoutes(prevRoutes => prevRoutes.filter(r => r.repartidorId !== targetUser.id));

        if (selectedRepartidorIdBySupervisor === targetUser.id) {
          setSelectedRepartidorIdBySupervisor(ALL_REPARTIDORES_KEY);
        }
      }

      const titleText = isSupervisorAction ? 'Repartidor Eliminado (Mock)' : 'Usuario Eliminado (Mock)';
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
      fetchRoutes(); // Refresh routes
    } catch (error: any) {
      toast({ variant: 'destructive', title: isSupervisorAction ? 'Error al Eliminar Repartidor (Mock)' : 'Error al Eliminar Usuario (Mock)', description: error.message });
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

  const handleSaveClient = (clientData: ClientFormData, id?: string) => {
    setIsLoading(true);
    try {
      if (id) {
        setClients(prevClients => 
          prevClients.map(c => c.id === id ? { ...c, ...clientData, updatedAt: new Date().toISOString() } : c)
        );
        toast({ title: "Cliente Actualizado (Mock)", description: `El cliente ${clientData.name} ha sido actualizado.` });
      } else {
        const newId = `mock-client-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
        const newClient: Client = {
          ...clientData,
          id: newId,
          branches: [], 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setClients(prevClients => [newClient, ...prevClients].sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
        toast({ title: "Cliente Agregado (Mock)", description: `El cliente ${newClient.name} ha sido agregado.` });
      }
      setIsAddEditClientDialogOpen(false);
      setIsManageClientsDialogOpen(true); 
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error al Guardar Cliente (Mock)', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const executeDeleteClient = () => {
    if (!clientToDelete) return;
    setIsLoading(true);
    try {
        setClients(prevClients => prevClients.filter(c => c.id !== clientToDelete.id));
        setInvoices(prevInvoices => 
          prevInvoices.map(inv => 
            inv.clientId === clientToDelete.id 
              ? { ...inv, clientId: null, client: null, updatedAt: new Date().toISOString() } 
              : inv
          )
        );
        toast({ title: "Cliente Eliminado (Mock)", description: `El cliente ${clientToDelete.name} ha sido eliminado.`});
        setClientToDelete(null);
        setIsConfirmDeleteClientOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error al Eliminar Cliente (Mock)', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleOpenManageRoutesDialog = () => {
    setSelectedDateForRoutesDialog(startOfDay(new Date())); // Default to today
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

  const handleSaveRoute = (routeData: RouteFormData, id?: string) => {
    setIsLoading(true);
    try {
      const repartidor = users.find(u => u.id === routeData.repartidorId);
      if (id) { // Editing existing route
        setRoutes(prevRoutes =>
          prevRoutes.map(r =>
            r.id === id
              ? { ...r, ...routeData, repartidorName: repartidor?.name, updatedAt: new Date().toISOString() }
              : r
          )
        );
        toast({ title: "Ruta Actualizada (Mock)", description: `Ruta para ${repartidor?.name || 'desconocido'} el ${formatISO(parseISO(routeData.date), { representation: 'date' })} actualizada.` });
      } else { // Creating new route
        const newRouteId = `mock-route-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newRoute: Route = {
          ...routeData,
          id: newRouteId,
          status: routeData.status || 'PLANNED',
          repartidorName: repartidor?.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setRoutes(prevRoutes => [newRoute, ...prevRoutes].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime() || new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
        toast({ title: "Ruta Creada (Mock)", description: `Nueva ruta creada para ${repartidor?.name || 'desconocido'} el ${formatISO(parseISO(routeData.date), { representation: 'date' })}.` });
      }
      setIsAddEditRouteDialogOpen(false);
      fetchInvoices(); 
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al Guardar Ruta (Mock)', description: error.message });
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

      if (selectedStatusBySupervisor) {
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
      const todayStr = formatISO(startOfDay(new Date()), { representation: 'date' });
      const repartidorRoutesToday = routes.filter(r => 
        r.repartidorId === loggedInUser.id && 
        isSameDay(parseISO(r.date), startOfDay(new Date())) && 
        (r.status === 'PLANNED' || r.status === 'IN_PROGRESS')
      );
      const invoiceIdsInRepartidorRoutesToday = repartidorRoutesToday.flatMap(r => r.invoiceIds);
      
      return invoices.filter(inv => 
        inv.status === 'PENDIENTE' && 
        (inv.assigneeId === loggedInUser.id || invoiceIdsInRepartidorRoutesToday.includes(inv.id))
      ).sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    }
    return [];
  }, [loggedInUser, invoices, selectedRepartidorIdBySupervisor, selectedStatusBySupervisor, searchTerm, routes]);


  const getInvoicesTitleForSupervisorOrAdmin = () => {
    let titleParts: string[] = [];
    let baseTitle = "Facturas";

    if (searchTerm.trim()) {
      titleParts.push(`Resultados para "${searchTerm.trim()}"`);
    }

    let statusDescription = "Todos los Estados";
    if (selectedStatusBySupervisor) {
        const statusDetail = statusCardDetails[selectedStatusBySupervisor];
        statusDescription = statusDetail ? statusDetail.label : `Facturas ${selectedStatusBySupervisor.toLowerCase()}`;
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
                    placeholder="Ej: admin / sup / john"
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
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader loggedInUser={loggedInUser} onLogout={handleLogout} />
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
                   <Button onClick={() => setIsManageClientsDialogOpen(true)} variant="outline" disabled={isLoading || clients.length === 0}>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                      onAction={isAdmin || isSupervisor ? handleEditInvoiceClick : handleProcessInvoiceClick}
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
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Mis Facturas Pendientes Para Hoy</h2>
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
             !isLoading && <p className="text-muted-foreground">No tienes facturas pendientes asignadas para hoy.</p>
            )}
          </section>
        )}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © 2025 SnapClaim. All rights reserved.
      </footer>

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
    </div>
  );
}
