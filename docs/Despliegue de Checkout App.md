# Deployment Guide — Checkout App

Guía de despliegue de la aplicación FullStack en un VPS con Ubuntu 24.04.

## 1. Arquitectura de despliegue

La aplicación utiliza la siguiente arquitectura:

```text
                         Internet
                            │
                            ▼
                 ┌─────────────────────┐
                 │      Nginx          │
                 │   HTTP / HTTPS      │
                 │       :80 / :443    │
                 └──────────┬──────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
      React + Vite SPA              NestJS API
      frontend/dist                 127.0.0.1:3001
              │                           │
              │                           ▼
              │                    PostgreSQL
              │                    Docker :5433
              │                           │
              └───────────────────────────┘
```

### Componentes

| Componente        | Tecnología              |
| ----------------- | ----------------------- |
| VPS               | Contabo Cloud VPS       |
| Sistema operativo | Ubuntu 24.04 LTS        |
| Frontend          | React + Vite            |
| Backend           | NestJS                  |
| Base de datos     | PostgreSQL 17           |
| Contenedores      | Docker + Docker Compose |
| Reverse Proxy     | Nginx                   |
| Process Manager   | PM2                     |
| SSL/TLS           | Let's Encrypt + Certbot |
| DNS               | Namecheap               |
| Dominio           | `templetus.com`         |

---

# 2. Requisitos

El servidor requiere:

* Ubuntu 24.04 LTS
* Usuario administrativo con `sudo`
* Acceso SSH mediante clave
* Docker
* Docker Compose
* Node.js 22+
* pnpm
* Nginx
* Certbot
* Git

---

# 3. Acceso al servidor

El usuario utilizado para el despliegue es:

```text
manuel
```

El acceso SSH se configura mediante una clave Ed25519.

Ejemplo desde Windows PowerShell:

```powershell
ssh -i "$HOME\.ssh\contabo_test" manuel@SERVER_IP
```

La clave privada **nunca debe almacenarse en el repositorio**.

---

# 4. Firewall

Se utiliza UFW.

Puertos permitidos:

```text
22    SSH
80    HTTP
443   HTTPS
```

Comprobar configuración:

```bash
sudo ufw status
```

La base de datos PostgreSQL **no se expone públicamente**.

---

# 5. Docker

Docker y Docker Compose se utilizan únicamente para PostgreSQL.

Comprobar instalación:

```bash
sudo docker --version
sudo docker compose version
```

Comprobar servicio:

```bash
sudo systemctl status docker
```

---

# 6. PostgreSQL

PostgreSQL se ejecuta mediante Docker Compose.

Archivo:

```text
~/checkout-app/docker-compose.yml
```

Configuración utilizada:

```yaml
name: checkout-app

services:
  postgres:
    image: postgres:17-alpine
    container_name: checkout-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-checkout}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-checkout}
      POSTGRES_DB: ${POSTGRES_DB:-checkout}
    ports:
      - '127.0.0.1:${POSTGRES_PORT:-5433}:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}']
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres-data:
```

### Importante

PostgreSQL escucha únicamente en:

```text
127.0.0.1:5433
```

Por lo tanto, no está disponible directamente desde Internet.

Verificar:

```bash
sudo docker ps
```

El contenedor esperado es:

```text
checkout-postgres
```

---

# 7. Código fuente

El proyecto se encuentra en:

```text
~/checkout-app
```

Repositorio:

```text
https://github.com/Manuelortegaj11/checkout-app
```

Clonar:

```bash
git clone https://github.com/Manuelortegaj11/checkout-app.git
cd checkout-app
```

---

# 8. Backend

El backend se encuentra en:

```text
~/checkout-app/backend
```

Requiere Node.js 22 o superior.

Comprobar:

```bash
node --version
pnpm --version
```

Instalar dependencias:

```bash
cd ~/checkout-app/backend
pnpm install --frozen-lockfile
```

---

# 9. Variables de entorno

El backend utiliza:

```text
backend/.env
```

Este archivo **no debe subirse al repositorio**.

La configuración de producción debe contener las variables necesarias para:

* PostgreSQL
* CORS
* Pasarela de pagos en Sandbox
* configuración de la aplicación

Ejemplo de conexión:

```env
DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@127.0.0.1:5433/<POSTGRES_DB>?schema=public
```

El origen de producción debe corresponder al dominio HTTPS:

```env
CORS_ORIGIN=https://templetus.com
```

### Seguridad

Nunca almacenar:

* API keys
* secretos
* private keys
* contraseñas
* tokens

en Git.

---

# 10. Migraciones Prisma

Comprobar estado:

```bash
pnpm run db:status
```

Aplicar migraciones:

```bash
pnpm run db:deploy
```

Generar Prisma Client:

```bash
pnpm prisma generate
```

Las migraciones se aplican sobre la base de datos PostgreSQL que corre en Docker.

---

# 11. Seed

El proyecto dispone de un seed para cargar los productos iniciales.

Ejecutar:

```bash
pnpm run db:seed
```

El seed actual carga:

```text
6 productos
```

No utilizar:

```bash
pnpm run db:reset
```

en producción, ya que elimina y recrea la base de datos.

---

# 12. Build del backend

Compilar NestJS:

```bash
pnpm run build
```

El resultado se genera en:

```text
backend/dist
```

---

# 13. Ejecución del backend con PM2

El backend se ejecuta mediante PM2.

Iniciar:

```bash
pm2 start dist/main.js --name checkout-backend
```

Comprobar:

```bash
pm2 status
```

Ver logs:

```bash
pm2 logs checkout-backend
```

El backend escucha localmente en:

```text
127.0.0.1:3001
```

Health check:

```bash
curl http://localhost:3001/api/health
```

Respuesta esperada:

```json
{
  "status": "ok"
}
```

---

# 14. Persistencia de PM2

Para permitir que PM2 restaure los procesos después de un reinicio:

```bash
pm2 startup
```

Ejecutar el comando `sudo` proporcionado por PM2.

Después guardar el estado actual:

```bash
pm2 save
```

Comprobar:

```bash
pm2 status
```

El proceso esperado es:

```text
checkout-backend
```

---

# 15. Frontend

El frontend se encuentra en:

```text
~/checkout-app/frontend
```

Instalar dependencias:

```bash
cd ~/checkout-app/frontend
pnpm install --frozen-lockfile
```

Generar producción:

```bash
pnpm build
```

Los archivos se generan en:

```text
frontend/dist
```

---

# 16. Frontend en producción

El frontend React/Vite es una SPA estática.

Por esta razón **no utiliza PM2**.

Nginx sirve directamente:

```text
/home/manuel/checkout-app/frontend/dist
```

PM2 solamente administra el proceso Node.js del backend.

---

# 17. Nginx

Nginx funciona como:

1. Servidor de archivos estáticos.
2. Reverse proxy para el backend.
3. Terminación HTTPS.
4. Aplicación de Security Headers.

Configuración:

```text
/etc/nginx/sites-available/checkout-app
```

Enlace habilitado:

```text
/etc/nginx/sites-enabled/checkout-app
```

Comprobar configuración:

```bash
sudo nginx -t
```

Recargar:

```bash
sudo systemctl reload nginx
```

---

# 18. Reverse Proxy

Las peticiones:

```text
/api/*
```

son enviadas al backend:

```text
http://127.0.0.1:3001
```

Ejemplo:

```text
https://templetus.com/api/health
```

se procesa internamente mediante:

```text
127.0.0.1:3001/api/health
```

---

# 19. React SPA Routing

Nginx utiliza:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Esto permite que las rutas de React funcionen correctamente al recargar la página.

---

# 20. DNS

El dominio utilizado es:

```text
templetus.com
```

También se configura:

```text
www.templetus.com
```

Ambos apuntan mediante registros `A` a la IP pública del VPS.

Comprobar:

```bash
dig +short templetus.com
dig +short www.templetus.com
```

---

# 21. HTTPS

HTTPS se configura mediante Let's Encrypt y Certbot.

Instalar:

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Obtener certificado:

```bash
sudo certbot --nginx \
  -d templetus.com \
  -d www.templetus.com \
  --email EMAIL \
  --agree-tos \
  --no-eff-email \
  --redirect \
  --non-interactive
```

El certificado se almacena en:

```text
/etc/letsencrypt/live/templetus.com/
```

Archivos principales:

```text
fullchain.pem
privkey.pem
```

El certificado es administrado automáticamente por Certbot.

Comprobar renovación:

```bash
sudo certbot renew --dry-run
```

---

# 22. HTTP → HTTPS

Las peticiones HTTP son redireccionadas:

```text
http://templetus.com
```

hacia:

```text
https://templetus.com
```

La aplicación pública utiliza HTTPS.

---

# 23. Security Headers

Nginx incluye las siguientes cabeceras:

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Objetivo

#### X-Content-Type-Options

Reduce ataques relacionados con MIME sniffing.

#### X-Frame-Options

Protege contra determinados escenarios de clickjacking.

#### Referrer-Policy

Limita la información de navegación enviada como `Referer`.

#### Permissions-Policy

Deshabilita funcionalidades innecesarias:

* Geolocalización
* Micrófono
* Cámara

#### Strict-Transport-Security

Indica al navegador que debe utilizar HTTPS durante el periodo configurado.

---

# 24. Verificar Security Headers

Ejecutar:

```bash
curl -I https://templetus.com
```

Comprobar específicamente:

```bash
curl -sI https://templetus.com | grep -Ei \
'x-content-type|x-frame|referrer-policy|permissions-policy|strict-transport'
```

---

# 25. Verificación del backend

Health check local:

```bash
curl http://localhost:3001/api/health
```

Health check mediante Nginx:

```bash
curl https://templetus.com/api/health
```

Ambos deben responder:

```json
{
  "status": "ok"
}
```

---

# 26. Verificación de productos

Comprobar:

```bash
curl https://templetus.com/api/products
```

La respuesta debe contener los productos cargados mediante el seed.

Actualmente se cargaron:

```text
6 productos
```

---

# 27. Flujo de despliegue

Para actualizar una versión existente:

```bash
cd ~/checkout-app
git pull
```

### Backend

```bash
cd backend
pnpm install --frozen-lockfile
pnpm run db:deploy
pnpm prisma generate
pnpm run build
pm2 restart checkout-backend
```

### Frontend

```bash
cd ../frontend
pnpm install --frozen-lockfile
pnpm run build
```

Nginx utilizará automáticamente los archivos actualizados de:

```text
frontend/dist
```

No es necesario reiniciar Nginx después de cada build del frontend.

---

# 28. Orden recomendado de actualización

Cuando se despliegue una nueva versión:

```text
1. Actualizar código
        ↓
2. Instalar dependencias
        ↓
3. Aplicar migraciones
        ↓
4. Generar Prisma Client
        ↓
5. Compilar backend
        ↓
6. Reiniciar PM2
        ↓
7. Compilar frontend
        ↓
8. Verificar Nginx
        ↓
9. Ejecutar health checks
        ↓
10. Probar flujo de checkout
```

---

# 29. Comandos de diagnóstico

### Estado de servicios

```bash
sudo systemctl status nginx --no-pager
sudo systemctl status docker --no-pager
pm2 status
```

### Contenedores

```bash
sudo docker ps
```

### Logs backend

```bash
pm2 logs checkout-backend
```

### Logs Nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Puertos

```bash
sudo ss -tulpn
```

### Firewall

```bash
sudo ufw status
```

---

# 30. Arquitectura de seguridad

La exposición pública queda limitada a:

```text
22    SSH
80    HTTP
443   HTTPS
```

PostgreSQL:

```text
127.0.0.1:5433
```

Backend:

```text
127.0.0.1:3001
```

Por lo tanto:

```text
Internet
   │
   ├── :80  → Nginx → HTTPS
   │
   └── :443 → Nginx
                │
                ├── React static files
                │
                └── /api → NestJS :3001
                              │
                              └── PostgreSQL :5433
```

Ni PostgreSQL ni el puerto 3001 necesitan estar expuestos públicamente.

---

# 31. Checklist de despliegue

* [x] Ubuntu actualizado
* [x] Usuario `manuel`
* [x] SSH mediante clave
* [x] UFW configurado
* [x] Docker instalado
* [x] PostgreSQL funcionando
* [x] Migraciones aplicadas
* [x] Seed ejecutado
* [x] 6 productos cargados
* [x] Node.js 22 instalado
* [x] pnpm instalado
* [x] Backend compilado
* [x] PM2 configurado
* [x] `pm2 save`
* [x] Frontend compilado
* [x] Nginx configurado
* [x] Reverse proxy `/api`
* [x] DNS configurado
* [x] HTTPS configurado
* [x] Certificado Let's Encrypt
* [x] Redirección HTTP → HTTPS
* [x] Security Headers
* [x] Prueba completa de checkout
* [x] Integración con la pasarela Sandbox
* [x] Pruebas Jest
* [x] Coverage >80%
* [x] Swagger/Postman
* [x] Diagrama de base de datos
* [x] Revisión final del README
* [x] Validación final de seguridad
* [x] Revisión final de la prueba técnica
