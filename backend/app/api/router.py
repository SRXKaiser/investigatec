
from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.perfiles import router as perfiles_router
from app.api.academico import router as academico_router
from app.api.roles import router as roles_router
from app.api.administracion import router as administracion_router
from app.api.proyectos import router as proyectos_router


api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(perfiles_router)
api_router.include_router(academico_router)
api_router.include_router(roles_router)
api_router.include_router(administracion_router)
api_router.include_router(proyectos_router)
