from fastapi import FastAPI
from starlette.staticfiles import StaticFiles

from server.routers import buildings

app = FastAPI(title="Hooned API")

app.mount("/pildid", StaticFiles(directory="pildid"), name="pildid")
app.include_router(buildings.router)