from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from server.routers import buildings

app = FastAPI(title="Hooned API")

# CORS - lubame frontend'il backendiga ühendust võtta
# (frontend töötab nt pordil 5500, backend pordil 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Arenduses OK. Production'is pane konkreetne URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/pildid", StaticFiles(directory="pildid"), name="pildid")
app.include_router(buildings.router)