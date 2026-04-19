# Interactive Buildings Map

An interactive map application with a PostgreSQL database, FastAPI backend, and HTML/JS frontend.

---

## Prerequisites

- [Python 3.8+](https://www.python.org/downloads/)
- [PostgreSQL](https://www.postgresql.org/download/)
- A modern web browser

---

## 1. Database Setup

**Start PostgreSQL:**
```bash
# Mac
brew services start postgresql

# Linux
sudo service postgresql start
```

**Create the database and restore from the dump:**
```bash
createdb buildings_db
psql buildings_db < Building_Designs_Tartu.sql
```

---

## 2. Backend Setup (FastAPI)

**Create and activate a virtual environment** (first time only):
```bash
python -m venv .venv

# Mac/Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

You should see `(.venv)` at the start of your terminal line.

**Install dependencies** (first time only):
```bash
pip install -r requirements.txt
```

**Create a `.env` file** in the project root (first time only):
```
DATABASE_URL=postgresql://user:pass@localhost/buildings_db
```

Replace `user` and `pass` with your actual PostgreSQL credentials.

**Create the `pildid` folder** (first time only):
```bash
mkdir pildid
```

**Start the server:**
```bash
uvicorn server.main:app --reload
```

Verify it's running at [http://localhost:8000/docs](http://localhost:8000/docs).

**To stop:** press `Ctrl+C`.

---

## 3. Frontend

Open `index.html` in your browser.

---

## Common Errors

**`command not found: uvicorn`**
Your virtual environment is not activated. Re-run the activate step above.

**`could not connect to server` (database error)**
PostgreSQL is not running. Start it with:
```bash
# Mac
brew services start postgresql

# Linux
sudo service postgresql start
```

**`No such file or directory: pildid`**
```bash
mkdir pildid
```
