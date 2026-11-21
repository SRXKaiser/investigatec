FROM python:3.13-slim
WORKDIR /code
COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt
COPY ./app ./app
COPY ./alembic ./alembic
COPY ./alembic.ini ./alembic.ini
RUN mkdir -p /code/storage
EXPOSE 8000
# Las migraciones y datos de roles iniciales se aplican en cada arranque,
# de manera idempotente, después de que PostgreSQL esté disponible.
CMD ["sh", "-c", "alembic upgrade head && python -m app.db.seeds.roles && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
