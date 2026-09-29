FROM node:22-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
RUN npm ci
COPY frontend frontend
RUN npm run build
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt && useradd -m wedding && mkdir /data && chown wedding /data
COPY backend backend
COPY --from=frontend /app/frontend/dist frontend/dist
ENV DATABASE_PATH=/data/save-the-date.sqlite
USER wedding
EXPOSE 8000
CMD ["uvicorn","backend.app:app","--host","0.0.0.0","--port","8000"]
