# 💎 DepilZone Proyect

Chat en tiempo real con **usuarios**, **salas**, **mensajes privados** y **presencia online** usando **React + Node.js + MongoDB + Socket.IO**.

> **Autor:** Maximiliano Nievas · **Full-Stack Dev** · **GitHub:** https://github.com/Maxi77s  
> **Front (Vercel):** https://depil-zone-proyect.vercel.app · **Back (Render):** https://depilzoneproyect.onrender.com

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
