# Messaging Test 1engage

## 📋 Prerequisites & Requirements

Before you begin, ensure you have the following installed on your machine:

### For Docker Deployment (Recommended)
- **Docker**: version 20.10+
- **Docker Compose**: version 2.0+

### For Local Development
- **Node.js**: version 20.x or higher
- **Bun**: version 1.1+ (required for `worker-service`)
- **PostgreSQL**: version 15+
- **RabbitMQ**: version 3.12+ (with Management Plugin)
- **Package Manager**: `npm` or `pnpm`

---

## 🚀 Installation & Setup

### Option 1: Using Docker (Fastest)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd messaging-platform
   ```

2. **Launch the entire stack**:
   ```bash
   docker-compose up --build
   ```

3. **Verify**:
   Wait for the "✅ Consumer registered" and "Connected to PostgreSQL" logs.

### Option 2: Local Manual Setup

If you prefer to run services manually for debugging:

1. **Start Infrastructure**: Ensure PostgreSQL and RabbitMQ are running.
2. **Setup API Service**:
   ```bash
   cd api-service
   npm install
   # Add DATABASE_URL and RABBITMQ_URL to your environment
   npm run dev
   ```
3. **Setup Worker Service**:
   ```bash
   cd ../worker-service
   bun install
   # Add RABBITMQ_URL and API_BASE_URL to your environment
   bun run dev
   ```
4. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## ⚙️ Environment Variables

The following variables are configured via `docker-compose.yml` but can be manually overridden:

| Variable | Service | Description | Default |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | API | Connection string for Postgres | `postgresql://postgres:postgres@localhost:5432/app` |
| `RABBITMQ_URL` | Both | AMQP connection string | `amqp://guest:guest@localhost:5672` |
| `API_BASE_URL` | Worker | URL for the API Webhooks | `http://api-service:3001/api` |
| `NEXT_PUBLIC_API_URL` | Frontend | Client-side URL for the API | `http://localhost:3001/api` |

---
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🏗️ Architecture & Flow

The system consists of three main components communicating via a shared database, a message queue, and webhooks:

1.  **API Service (NestJS)**: Receives send requests, stores initial data in PostgreSQL, and enqueues tasks to RabbitMQ. It also broadcasts live events via **SSE (Server-Sent Events)**.
2.  **Worker Service (Bun)**: Consumes messages from RabbitMQ, simulates delivery latency (2–5s), updates the message lifecycle, and notifies the API via webhooks.
3.  **Frontend (Next.js)**: A premium dashboard that tracks message status live without page refreshes.

### Message Flow
`Client` → `API Service` → `PostgreSQL` → `RabbitMQ` → `Worker Service` → `API Webhook` → `SSE Update` → `Dashboard`

---

## 🛠️ Components & Endpoints

### 📱 Frontend Dashboard
- **URL**: [http://localhost:3000](http://localhost:3000)
- **Features**: Live message feed, delivery status tracking (Queued → Processing → Sent → Delivered), and real-time statistics.

### 🔌 API Service
- **Swagger Documentation**: [http://localhost:3001/docs](http://localhost:3001/docs)
- **Base URL**: `http://localhost:3001/api`
- **SSE Stream**: `http://localhost:3001/api/dashboard/stream`
- **Key Endpoints**:
    - `POST /messages`: Send a new message.
    - `GET /messages?receiver=<number>`: List messages with filtering.
    - `GET /dashboard/stats`: Get current delivery snapshots.

### ⚙️ Worker Service
- **Execution Environment**: [Bun.sh](https://bun.sh)
- **Responsibility**: Simulates "Network Processing" and handles the message lifecycle logic.

---

## 📊 Message Statuses

| Status | Description |
| :--- | :--- |
| `queued` | Message accepted by API and waiting in RabbitMQ. |
| `processing` | Worker has picked up the message and is "sending" it. |
| `sent` | Message has been successfully sent to the simulated carrier. |
| `delivered` | Simulated carrier confirmed delivery to the device. |
| `failed` | Message failed to deliver (simulated 20% failure rate). |
| `read` | Simulated user has opened the message (triggerable via API). |

---

## 🛠️ Tech Stack

- **Backend**: Node.js (NestJS), Bun (Elysia)
- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion
- **Database**: PostgreSQL (pg client)
- **Queue**: RabbitMQ 4.0
- **Real-time**: Server-Sent Events (SSE)
