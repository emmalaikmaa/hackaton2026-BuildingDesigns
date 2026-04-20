# Interactive Buildings Map

An interactive map application featuring a PostgreSQL database, FastAPI backend, and HTML/JS frontend. Browse and explore building designs in Tartu with an image gallery powered by a curated dataset.

> 🎥 **[Watch a demo of the application](https://drive.google.com/file/d/13iqr7BfmkNZZD7IyfRyvUMWd-KmfnSFf/view?usp=share_link)**

---

## Image Dataset Access

The building pictures displayed in the application come from a **privately owned dataset**. To have images show up properly, you must **request access from the dataset owner** before setting up the application.

Without approval, the app will run but the image gallery will be empty.

Once approved, place the received image files inside the `pildid/` folder in the project root (see setup steps below).

---

## Prerequisites

- [Python 3.8+](https://www.python.org/downloads/)
- [PostgreSQL](https://www.postgresql.org/download/)
- A modern web browser
- **For Docker path:** [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

---

## Choose Your Setup Path

| | [Path A — Manual](#path-a--manual-setup) | [Path B — Docker](#path-b--docker-setup) |
|---|---|---|
| **Best for** | Development, debugging | Quick setup, consistent environments |
| **Requires** | Python, PostgreSQL installed locally | Docker & Docker Compose only |
| **Startup** | Multiple steps | Single command |

---

## Path A — Manual Setup

### 1. Database Setup

**Start PostgreSQL:**

```bash
# macOS
brew services start postgresql

# Linux
sudo service postgresql start
```

**Create the database and load the data:**

```bash
createdb buildings_db
psql buildings_db < Building_Designs_Tartu.sql
```

---

### 2. Backend Setup (FastAPI)

**Create and activate a virtual environment** *(first time only)*:

```bash
python -m venv .venv

# macOS/Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

You should see `(.venv)` at the start of your terminal line.

**Install dependencies** *(first time only)*:

```bash
pip install -r requirements.txt
```

**Create a `.env` file** in the project root *(first time only)*:

```
DATABASE_URL=postgresql://user:pass@localhost/buildings_db
```

Replace `user` and `pass` with your actual PostgreSQL credentials.

**Create the `pildid` folder** *(first time only)*:

```bash
mkdir pildid
```

Then place your approved image files inside this folder (see [Image Dataset Access](#️-image-dataset-access) above).

**Start the backend server:**

```bash
uvicorn server.main:app --reload
```

Verify it's running at [http://localhost:8000/docs](http://localhost:8000/docs).

To stop the server, press `Ctrl+C`.

---

### 3. Frontend

Open `index.html` in your browser.

---

## Path B — Docker Setup

Docker handles the database and backend automatically — no need to install PostgreSQL or Python locally.

### 1. Prepare the image folder

```bash
mkdir pildid
```

Place your approved image files inside this folder (see [Image Dataset Access](#️-image-dataset-access) above).

### 2. Create a `.env` file

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://user:pass@db/buildings_db
POSTGRES_USER=user
POSTGRES_PASSWORD=pass
POSTGRES_DB=buildings_db
```

You can choose any username and password — Docker will use these to create the database.

### 3. Start everything

```bash
docker compose up --build
```

This will:
- Start a PostgreSQL container and load `Building_Designs_Tartu.sql`
- Build and start the FastAPI backend

Verify the backend is running at [http://localhost:8000/docs](http://localhost:8000/docs).

### 4. Frontend

Open `index.html` in your browser.

### Stopping the application

```bash
docker compose down
```

To also remove the database volume (resets all data):

```bash
docker compose down -v
```

---

## Common Errors

**`command not found: uvicorn`**
Your virtual environment is not activated. Re-run the activate step from [Path A, Step 2](#2-backend-setup-fastapi).

**`could not connect to server` (database error)**
PostgreSQL is not running. Start it with:

```bash
# macOS
brew services start postgresql

# Linux
sudo service postgresql start
```

**`No such file or directory: pildid`**

```bash
mkdir pildid
```

**Images not showing in the app**
Make sure you have requested and received approval from the dataset owner, and that the image files are placed inside the `pildid/` folder.

**Docker: port already in use**
Another service is using port 8000 or 5432. Stop the conflicting service, or edit `docker-compose.yml` to use different ports.
