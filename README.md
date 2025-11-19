# Fleet Management - Sistema de Gestión de Flota

Aplicación completa para gestionar una flota de vehículos empresariales con aproximadamente 50 vehículos.

## Características

- **Gestión de Vehículos**: CRUD completo de vehículos con información detallada
- **Tipos de Vehículos**: Soporte para coches 🚗, furgonetas 🚐, camiones 🚚, tractores 🚜, remolques 🚛 y maquinaria 🏗️
- **Sistema de Reservas**: Los empleados pueden reservar vehículos con justificación de uso
- **Panel de Administración**: Dashboard completo con estadísticas y control de la flota
- **Portal de Empleados**: Interfaz para que los empleados gestionen sus reservas
- **Mantenimiento**: Control de ITV, talleres y reparaciones
- **Sistema de Multas**: Identificación automática del conductor responsable
- **Autenticación**: Login local y SSO con Entra ID (Microsoft Azure AD)

## 🚀 Inicio Rápido

### Primer Uso - Crear Usuario Administrador

Para crear el usuario administrador, debes hacerlo desde el **Dashboard de Supabase**:

1. **Ve a tu proyecto de Supabase**: https://supabase.com/dashboard
2. **Navega a Authentication > Users**
3. **Haz clic en "Add user" > "Create new user"**
4. **Completa el formulario**:
   - Email: `admin@agroptimum.com` (o el que prefieras)
   - Password: Crea una contraseña segura
   - ✅ Marca "Auto Confirm User" para que no requiera confirmación de email
5. **Copia el User ID** que se genera
6. **Ve a Table Editor > employees**
7. **Haz clic en "Insert" > "Insert row"**
8. **Completa los datos**:
   - `id`: Pega el User ID que copiaste
   - `email`: El mismo email del usuario
   - `full_name`: Nombre del administrador
   - `department`: "Administración"
   - `phone`: Número de teléfono
   - `is_admin`: `true` ✅
9. **Guarda el registro**

Ahora puedes iniciar sesión en `/login` con el email y contraseña que creaste.

### Credenciales de Ejemplo

Después de crear el usuario en Supabase:
- **Email**: admin@agroptimum.com (o el que hayas configurado)
- **Contraseña**: La que hayas establecido en Supabase

## Configuración

### 1. Base de Datos (Supabase)

Los scripts SQL se ejecutan automáticamente cuando despliegas la aplicación. Si necesitas ejecutarlos manualmente:

1. Ve a la carpeta `scripts/`
2. Ejecuta los scripts en orden desde el SQL Editor de Supabase:
   - `01-create-tables.sql` - Crea las tablas
   - `02-create-functions.sql` - Crea funciones auxiliares
   - `03-seed-data.sql` - Datos de ejemplo
   - `04-row-level-security.sql` - Seguridad RLS
   - `05-create-admin-user.sql` - Usuario administrador
   - `06-fix-employee-creation.sql` - Función para crear empleados
   - `07-import-real-vehicles.sql` - **Importa los 43 vehículos reales de Agroptimum** 🚗🚜🚛

### 2. Importar Vehículos Reales

El script `07-import-real-vehicles.sql` contiene todos los vehículos reales de la empresa:

- **23 vehículos** (coches, furgonetas, camiones): Toyota Hilux, Audi Q3, Ford Transit, Dacia Duster, etc.
- **12 tractores**: Kubota, John Deere, Fendt, Merlo
- **8 remolques y maquinaria**: Remolques, atomizadores, carretillas, retroexcavadoras

Cada vehículo incluye:
- Matrícula real
- Marca y modelo
- Tipo de vehículo (con icono correspondiente)
- Empresa propietaria (AGROPTIMUM o ACEMI)

### 3. Variables de Entorno

Las variables de Supabase ya están configuradas automáticamente en el proyecto.

### 4. SSO con Entra ID (Opcional)

Para configurar SSO con Microsoft Entra ID:

1. **En Azure Portal**:
   - Registra una nueva aplicación
   - Configura las URLs de redirección: `https://tu-dominio.com/auth/callback`
   - Copia el Client ID y Client Secret

2. **En Supabase Dashboard**:
   - Ve a Authentication > Providers > Azure
   - Activa el provider
   - Añade el Client ID y Client Secret de Azure
   - Configura la URL de redirección

3. **Prueba el login**:
   - Haz clic en "Iniciar sesión con Entra ID" en la página de login
   - Inicia sesión con tu cuenta corporativa de Microsoft

## Estructura del Proyecto

\`\`\`
├── app/
│   ├── admin/              # Panel de administración
│   ├── dashboard/          # Portal de empleados
│   ├── login/              # Página de login
│   └── api/                # API routes
├── components/
│   ├── admin/              # Componentes de admin
│   ├── employee/           # Componentes de empleados
│   ├── vehicles/           # Gestión de vehículos
│   ├── bookings/           # Sistema de reservas
│   ├── maintenance/        # Mantenimiento
│   └── fines/              # Multas
├── lib/
│   ├── supabase/           # Clientes de Supabase
│   └── types.ts            # Tipos TypeScript
└── scripts/                # Scripts SQL
\`\`\`

## Uso

### Para Administradores

1. Inicia sesión con tu cuenta de administrador
2. Accede al panel de administración
3. Gestiona vehículos, reservas, mantenimiento y multas
4. Visualiza estadísticas en tiempo real
5. Controla la ubicación de los vehículos (cuando se integre la API GPS)

### Para Empleados

1. Inicia sesión con tu cuenta corporativa
2. Explora los vehículos disponibles
3. Crea reservas con justificación de uso
4. Gestiona tus reservas activas
5. Consulta el historial de tus reservas

## Funcionalidades Principales

### 🚗 Gestión de Vehículos
- Añadir, editar y eliminar vehículos
- Ver estado en tiempo real (disponible, en uso, mantenimiento)
- Información detallada: matrícula, marca, modelo, año, combustible, etc.
- **Iconos por tipo**: 🚗 Coches, 🚜 Tractores, 🚛 Remolques, 🏗️ Maquinaria

### 📅 Sistema de Reservas
- Reservar vehículos con fechas y justificación
- Verificación automática de disponibilidad
- Calendario visual de reservas
- Aprobación/rechazo de reservas (admin)

### 🔧 Mantenimiento
- Programar ITV, talleres y reparaciones
- Alertas de mantenimiento próximo
- Historial completo de mantenimiento
- Control de costos

### 🚨 Sistema de Multas
- Registrar multas con fecha y matrícula
- Identificación automática del conductor responsable
- Gestión de estado de multas (pendiente, pagada, apelada)
- Historial de multas por vehículo y empleado

### 📊 Panel de Administración
- Dashboard con estadísticas clave
- Vehículos disponibles vs en uso
- Reservas activas y próximas
- Mantenimientos pendientes
- Vista de ubicación de vehículos (próximamente)

## Tecnologías

- **Framework**: Next.js 16 con App Router
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth + Entra ID SSO
- **UI**: shadcn/ui + Tailwind CSS v4
- **TypeScript**: Tipado completo
- **Iconos**: Lucide React + Emojis para tipos de vehículos

## Próximas Integraciones

- 📍 API de ubicación GPS para tracking en tiempo real
- 🔔 Notificaciones automáticas de mantenimiento
- 📈 Reportes y exportación de datos
- 📱 Aplicación móvil para empleados
- 🤖 Predicción de mantenimiento con IA

## Soporte

Si tienes problemas o preguntas:
1. Revisa la documentación
2. Verifica que las variables de entorno estén configuradas
3. Asegúrate de que los scripts SQL se hayan ejecutado correctamente
4. Contacta al equipo de desarrollo

---

Desarrollado con ❤️ para Agroptimum
