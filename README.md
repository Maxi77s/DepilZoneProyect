# 💎 DepilZone Proyect

Chat en tiempo real con **usuarios**, **salas**, **mensajes privados** y **presencia online** usando **React + Node.js + MongoDB + Socket.IO**.

> **Autor:** Maximiliano Nievas · **Full-Stack Dev** · **GitHub:** https://github.com/Maxi77s  
> **Front (Vercel):** https://depil-zone-proyect.vercel.app · **Back (Render):** https://depilzoneproyect.onrender.com

---

## 🧭 Tutorial: levantar el proyecto localmente (paso a paso)

### 0) Requisitos
- **Node.js 18+**
- **MongoDB** (Atlas o local). Si usás Atlas, asegurate de **permitir tu IP** en Network Access.
- Puertos libres: **4000** (backend) y **5173** (frontend).

### 1) Clonar el repositorio
```bash
git clone https://github.com/Maxi77s/DepilZone
cd DepilZone
```

### 2) Configurar variables de entorno
Creá los archivos `.env` según se indica abajo (podés copiar/pegar este contenido y ajustar valores):

**`back/.env`**
```
PORT=4000
MONGO_URI=mongodb+srv://<USER>:<PASS>@<CLUSTER>/depilzone?retryWrites=true&w=majority
JWT_SECRET=<your_secret>
CORS_ORIGIN=http://localhost:5173
```

**`front/.env`**
```
VITE_API_URL=http://localhost:4000
```

> Para producción, los valores típicos son:  
> `VITE_API_URL=https://depilzoneproyect.onrender.com`  
> `CORS_ORIGIN=https://depil-zone-proyect.vercel.app`

### 3) Instalar y levantar el **Backend**
```bash
cd back
npm install
npm run dev
# Servidor en http://localhost:4000
```

### 4) Instalar y levantar el **Frontend**
En otra terminal:
```bash
cd front
npm install
npm run dev
# App en http://localhost:5173
```

### 5) (Opcional) Cargar datos de prueba — *seed manual* vía API
Podés crear **2 usuarios**, **1 sala** y **mensajes** usando `curl`. Si tenés `jq`, los tokens/IDs se guardan automáticamente.

```bash
# Base
API=http://localhost:4000

# 5.1 Registrar usuarios demo
curl -s -X POST "$API/auth/register" -H "Content-Type: application/json"   -d '{"name":"Admin Demo","email":"admin@demo.com","password":"admin123"}'

curl -s -X POST "$API/auth/register" -H "Content-Type: application/json"   -d '{"name":"Usuario Demo","email":"user@demo.com","password":"user123"}'

# 5.2 Login y guardar tokens (requiere jq)
ADMIN_TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json"   -d '{"email":"admin@demo.com","password":"admin123"}' | jq -r '.token')

USER_TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json"   -d '{"email":"user@demo.com","password":"user123"}' | jq -r '.token')

# 5.3 Obtener IDs de usuario
ADMIN_ID=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$API/auth/me" | jq -r '.user._id')
USER_ID=$(curl -s -H "Authorization: Bearer $USER_TOKEN" "$API/auth/me" | jq -r '.user._id')

# 5.4 Crear sala con ambos participantes
ROOM_ID=$(curl -s -X POST "$API/rooms"   -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json"   -d "{"name":"Equipo Demo","participants":["$ADMIN_ID","$USER_ID"]}" | jq -r '._id')

# 5.5 Mensajes de prueba (sala y privado)
curl -s -X POST "$API/rooms/$ROOM_ID/messages"   -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json"   -d '{"text":"Bienvenidos a la sala demo 👋"}' > /dev/null

curl -s -X POST "$API/rooms/$ROOM_ID/messages"   -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json"   -d '{"text":"Hola! Probando el chat en tiempo real."}' > /dev/null

curl -s -X POST "$API/private"   -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json"   -d "{"to":"$USER_ID","text":"Mensaje privado de prueba."}" > /dev/null
```

> **Sin `jq`**: podés hacer lo mismo con **Postman/Thunder Client**:  
> 1) `POST /auth/register` (x2).  
> 2) `POST /auth/login` (x2) y copiá los **token**.  
> 3) `GET /auth/me` (x2) para obtener cada **_id**.  
> 4) `POST /rooms` con `name` y `participants` (ambos IDs).  
> 5) `POST /rooms/:id/messages` y `POST /private` para enviar mensajes.

### 6) Notas y solución de problemas
- **CORS**: si el front corre en `http://localhost:5173`, asegurate de tener `CORS_ORIGIN=http://localhost:5173` en el `.env` del back.  
- **MongoDB Atlas**: añadí tu IP en *Network Access* y verificá usuario/clave/cluster del `MONGO_URI`.  
- **Versión de Node**: usar **Node 18+**.  
- **Salud del servidor**: `GET http://localhost:4000/health` debería responder **200**.

---

## 📛 Badges

![Status](https://img.shields.io/badge/status-active-success.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## 🚀 Stack

**Frontend**
- React + Vite
- TailwindCSS
- Axios
- JWT

**Backend**
- Node.js + Express
- Socket.IO
- MongoDB (Mongoose)
- JWT

**Dev / Deploy**
- GitHub
- ESLint + Prettier
- Vercel (front) / Render (back)

---

## 📂 Estructura

```
DepilZoneProyect/
├─ back/            # Node + Express + Socket.IO (TypeScript)
│  ├─ src/
│  │  ├─ config/    # db, env, cors
│  │  ├─ controllers/
│  │  ├─ routes/
│  │  ├─ models/    # User, Room, RoomMessage, PrivateMessage
│  │  └─ index.ts   # bootstrap API + sockets
├─ front/           # React + Vite + Tailwind
│  └─ src/
│     ├─ components/
│     ├─ views/
│     ├─ hooks/     # useChatLogic, useRoomChatLogic, useAuthPresence
│     └─ services/  # api, auth.service, socket client
└─ README.md
```

---

## ⚙️ Variables de Entorno

**`back/.env`**
```
PORT=4000
MONGO_URI=mongodb+srv://<USER>:<PASS>@<CLUSTER>/depilzone?retryWrites=true&w=majority
JWT_SECRET=<your_secret>
CORS_ORIGIN=http://localhost:5173
```

**`front/.env`**
```
VITE_API_URL=http://localhost:4000
```

> En producción:  
> `VITE_API_URL=https://depilzoneproyect.onrender.com`  
> `CORS_ORIGIN=https://depil-zone-proyect.vercel.app`

---

## ▶️ Quick Start

**Backend**
```bash
cd back
npm install
npm run dev
```

**Frontend**
```bash
cd front
npm install
npm run dev
```

---

## 📦 Scripts

**Backend (`back/package.json`)**
```json
{
  "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
  "build": "tsc -p tsconfig.json",
  "start": "node dist/index.js"
}
```

**Frontend (`front/package.json`)**
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

---

## ⚡ Socket.IO (eventos clave)

- Cliente emite: `join_room`, `room:send_message`, `private:send`, `typing:start`, `typing:stop`
- Servidor emite: `room:message:new`, `private:message:new`, `users_online`, `presence:update`

> **Auth en sockets:** enviar `auth: { token: "<JWT>" }` al conectar.

---

## ✅ Checklist Rápido

- Login/Registro ✅ JWT vigente  
- CORS ✅ Vercel ⇄ Render  
- Rooms y mensajes privados ✅  
- Presencia online/offline ✅  
- Índices de Mongo (email único, mensajes por room) ✅

---

## 📚 Endpoints (REST)

> Base URL local: `http://localhost:4000` · Producción: `https://depilzoneproyect.onrender.com`  
> **Auth:** usar `Authorization: Bearer <token>` donde se indique.

### 🔐 Auth
- **POST** `/auth/register` — _Public_  
  Body: `{ "name", "email", "password" }`
- **POST** `/auth/login` — _Public_  
  Body: `{ "email", "password" }` → `{ token, user }`
- **GET** `/auth/me` — _Auth_

### 👥 Users
- **GET** `/users` — _Auth_
- **GET** `/users/:id` — _Auth_

### 🗂️ Rooms
- **GET** `/rooms` — _Auth_ (listar mis salas)
- **POST** `/rooms` — _Auth_  
  Body: `{ "name", "participants": ["<userId>", ...] }`
- **GET** `/rooms/:id` — _Auth_
- **GET** `/rooms/:id/messages?limit=&before=` — _Auth_
- **POST** `/rooms/:id/messages` — _Auth_  
  Body: `{ "text": "..." }`

### 💬 Mensajes Privados
- **GET** `/private?userId=<id>&limit=` — _Auth_
- **POST** `/private` — _Auth_  
  Body: `{ "to": "<userId>", "text": "..." }`
- **PATCH** `/private/read` — _Auth_ (si está implementado)  
  Body: `{ "from": "<userId>" }`

### 🩺 Health
- **GET** `/health` — _Public_

---

## 🧑‍💻 Autor

**Maximiliano Nievas** · Desarrollador Full-Stack  
GitHub: https://github.com/Maxi77s
