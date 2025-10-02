from fastapi import FastAPI

from .api.routes.research import router as research_router


def create_app() -> FastAPI:
    app = FastAPI(title="Kivo Backend", version="0.1.0")
    app.include_router(research_router, prefix="/research", tags=["research"])
    return app


app = create_app()
