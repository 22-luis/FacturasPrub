
# Flujo de Procesamiento de Facturas en SnapClaim

Este documento detalla el ciclo de vida y el proceso de manejo de facturas dentro de la aplicación SnapClaim, involucrando los roles de Supervisor y Repartidor.

## Diagrama General del Flujo

```mermaid
graph TD
    A[Supervisor: Inicia Sesión] --> B{Panel de Supervisor};
    B -- Crear Nueva Factura --> C[Formulario: Llenar Datos de Factura];
    C --> D[Factura Creada (Estado: PENDIENTE)];
    B -- Gestionar Facturas --> E[Lista de Facturas Existentes];
    E -- Editar Factura --> F[Formulario: Modificar Datos / Asignar];
    D -- Asignar --> G[Seleccionar Repartidor];
    F -- Asignar --> G;
    G --> H[Factura Asignada al Repartidor (Estado: PENDIENTE)];

    I[Repartidor: Inicia Sesión] --> J{Panel de Repartidor};
    J --> K[Ver Lista de Facturas Asignadas (PENDIENTES)];
    K -- Seleccionar Factura --> L[Procesar Factura: Detalles + Carga de Imagen];
    L -- Cargar Imagen de Factura Física --> M[Sistema: Extracción de Datos (IA)];
    M --> N[Sistema: Comparación de Datos (Asignados vs. Extraídos)];
    N --> O[Repartidor: Visualiza Resultados de Comparación];
    O --> P{Repartidor: Toma de Decisión};
    P -- Entrega Exitosa y Datos Coinciden --> Q[Actualizar Estado a: ENTREGADA];
    P -- Pedido Cancelado --> R[Actualizar Estado a: CANCELADA];
    R -- Ingresar Motivo --> S[Motivo de Cancelación Guardado];
    P -- Discrepancias / Revertir --> K;

    Q --> T[Factura Finalizada];
    S --> T;
```

## Etapas Detalladas del Proceso

### 1. Rol: Supervisor

El supervisor es responsable de ingresar nuevas facturas al sistema y asignarlas a los repartidores.

#### 1.1. Inicio de Sesión y Acceso al Panel
   - El supervisor ingresa sus credenciales (nombre de usuario y contraseña).
   - Al iniciar sesión, accede a su panel de control donde puede ver opciones para agregar y gestionar facturas y repartidores.

#### 1.2. Creación y Llenado de Nueva Factura
   - **Acción:** El supervisor selecciona la opción "Agregar Factura".
   - **Formulario:** Se presenta un formulario para ingresar los detalles de la factura:
      - `Número de Factura`: Identificador único de la factura.
      - `Fecha`: Fecha de emisión de la factura (YYYY-MM-DD).
      - `Monto Total`: Valor total de la factura.
      - `Nombre del Proveedor`: Entidad que emite la factura.
      - `Código Único`: Código identificador del producto o servicio principal de la factura.
      - `Dirección`: Dirección de entrega asociada a la factura.
      - `Asignar a Repartidor` (Opcional en este paso): Puede seleccionar un repartidor o dejarlo sin asignar.
      - `Estado`: Por defecto es `PENDIENTE` al crear una nueva factura.
   - **Guardado:** Al guardar, la factura se crea en el sistema con estado `PENDIENTE`.

#### 1.3. Asignación de Factura a Repartidor
   - **Contexto:** Puede ocurrir durante la creación de la factura o al editar una factura existente.
   - **Proceso:**
      - El supervisor selecciona la factura que desea asignar (o está creando).
      - En el campo "Asignar a Repartidor", elige un usuario con el rol "repartidor" de una lista desplegable.
      - Guarda los cambios.
   - **Resultado:** La factura queda vinculada al repartidor seleccionado y mantiene su estado `PENDIENTE` (o el estado que tuviera si se está editando). Si no se asigna, permanece visible para el supervisor/administrador para una asignación posterior.

### 2. Rol: Repartidor

El repartidor es responsable de procesar las facturas que le son asignadas, verificando los datos contra la factura física y actualizando su estado.

#### 2.1. Inicio de Sesión y Visualización de Facturas
   - El repartidor ingresa sus credenciales.
   - Al iniciar sesión, accede a su panel donde visualiza una lista de las facturas que le han sido asignadas y se encuentran en estado `PENDIENTE`.

#### 2.2. Selección y Procesamiento de Factura Individual
   - **Acción:** El repartidor selecciona una factura de su lista.
   - **Vista de Procesamiento:** Se abre un diálogo o pantalla que muestra:
      - Los detalles de la factura asignada por el supervisor.
      - Opciones para cambiar el estado de la factura (`ENTREGADA`, `CANCELADA`).
      - Una sección para cargar la imagen de la factura física.

#### 2.3. Carga de Imagen de Factura Física
   - **Acción:** El repartidor utiliza el componente de carga de archivos.
   - **Método:** Puede tomar una foto de la factura física con su dispositivo (si es móvil) o seleccionar un archivo de imagen (ej. PNG, JPG) previamente guardado.
   - **Resultado:** La imagen se carga en el sistema y se muestra una vista previa.

#### 2.4. Extracción y Verificación de Datos (Impulsada por IA)
   - **Activación:** Una vez cargada la imagen, el repartidor hace clic en "Extraer y Verificar Datos".
   - **Proceso del Sistema:**
      1. La imagen (como data URI) se envía al flujo de Genkit (`extractInvoiceDataAction`).
      2. La IA configurada (modelo Gemini) procesa la imagen para extraer:
         - Número de Factura
         - Fecha
         - Monto Total
         - Nombre del Proveedor
      3. Los datos extraídos por la IA se comparan automáticamente con los datos de la factura que fueron ingresados originalmente por el supervisor.
   - **Visualización de Resultados:**
      - El repartidor ve una sección con "Datos Extraídos de Factura".
      - Se muestra un "Resultado de Verificación" que indica:
         - Si todos los campos principales coinciden (`Data Matched`).
         - Si hay discrepancias (`Data Mismatch`).
         - Un desglose campo por campo mostrando el valor asignado, el valor extraído y si coinciden.

#### 2.5. Toma de Decisiones y Actualización de Estado de la Factura
Basándose en la verificación de datos y el resultado real de la gestión de entrega, el repartidor toma una de las siguientes acciones:

   - **Opción A: Entrega Exitosa**
      - **Condición:** El pedido fue entregado satisfactoriamente al cliente y, idealmente, los datos de la factura física (verificados por la IA o visualmente por el repartidor) coinciden con los datos del sistema.
      - **Acción del Repartidor:** Hace clic en el botón "Marcar como ENTREGADA".
      - **Resultado:** El estado de la factura cambia a `ENTREGADA`. La factura generalmente desaparece de la lista de "pendientes" del repartidor.

   - **Opción B: Pedido Cancelado**
      - **Condición:** El pedido no pudo ser entregado por diversas razones.
      - **Acción del Repartidor:** Hace clic en el botón "Marcar como CANCELADA".
      - **Sub-diálogo de Motivo:**
         - Se presenta un diálogo preguntando si el cliente proporcionó un motivo.
         - Si "Sí", el repartidor ingresa el texto del motivo.
         - Si "No", puede confirmar sin motivo.
      - **Posibles Motivos de Cancelación:**
         - Cliente rechazó el pedido.
         - Dirección incorrecta o no encontrada.
         - Cliente ausente tras intentos de contacto.
         - Producto no disponible o dañado al momento de la entrega.
         - Error en el pedido original.
      - **Resultado:** El estado de la factura cambia a `CANCELADA` y el motivo (si se proporcionó) se guarda asociado a la factura. La factura desaparece de la lista de "pendientes".

   - **Opción C: Revertir a Pendiente (Si ya fue Entregada/Cancelada)**
      - **Condición:** Si una factura fue marcada erróneamente como ENTREGADA o CANCELADA, el repartidor (o supervisor con permisos) puede tener la opción de revertir su estado a PENDIENTE para correcciones o reprocesamiento.
      - **Acción del Repartidor:** Hace clic en el botón "Revertir a PENDIENTE".
      - **Resultado:** El estado de la factura vuelve a `PENDIENTE`.

   - **Opción D: Discrepancias Persistentes (Acción Implícita)**
      - **Condición:** Si la verificación de IA muestra discrepancias significativas entre la factura física y los datos del sistema, y el repartidor no puede resolverlas o la política requiere aprobación del supervisor.
      - **Acción Implícita Actual:**
         - El repartidor podría mantener la factura como `PENDIENTE`.
         - Comunicar la discrepancia al supervisor fuera de la aplicación (o según los procedimientos establecidos).
         - El supervisor puede luego editar los detalles de la factura en el sistema si es necesario.
      - *Nota: La aplicación actual no tiene un estado específico de "En Disputa" o "Requiere Revisión del Supervisor" directamente manejable por el repartidor. El flujo se basa en mantenerla PENDIENTE o que el supervisor la corrija.*

### 3. Gestión de Usuarios (Roles Supervisor y Administrador)

   - **Supervisor:**
      - Puede agregar nuevos usuarios con el rol "repartidor".
      - Puede editar los nombres de los repartidores existentes.
      - Puede eliminar repartidores (las facturas asignadas quedan "Sin asignar").
   - **Administrador:**
      - Tiene todos los permisos del supervisor.
      - Adicionalmente, puede agregar, editar y eliminar usuarios con roles "supervisor" y "repartidor".
      - No puede modificar ni eliminar a otros administradores ni a sí mismo a través de la interfaz de gestión de usuarios estándar.

## Ciclo de Vida de los Estados de la Factura

1.  **PENDIENTE:**
    *   Creada por el supervisor.
    *   Asignada (o por asignar) a un repartidor.
    *   Esperando procesamiento por parte del repartidor.
    *   Puede volver a este estado si se revierte desde ENTREGADA o CANCELADA.

2.  **ENTREGADA:**
    *   Marcada por el repartidor tras una entrega exitosa y verificación (idealmente).
    *   Representa una transacción completada.

3.  **CANCELADA:**
    *   Marcada por el repartidor si la entrega no fue posible.
    *   Debe incluir un motivo si está disponible.
    *   Representa una transacción no completada.

Este flujo busca asegurar la correcta captura de datos, una verificación eficiente y un seguimiento claro del estado de cada factura.
