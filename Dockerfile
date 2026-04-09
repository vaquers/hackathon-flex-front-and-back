# Stage 1: Build frontend
FROM node:20-slim AS frontend-build
WORKDIR /frontend
COPY flex&roll_pro/frontend/package.json flex&roll_pro/frontend/package-lock.json* ./
RUN npm install
COPY flex&roll_pro/frontend/ .
RUN npm run build

# Stage 2: Backend + serve frontend
FROM python:3.12-slim
WORKDIR /app

COPY flex&roll_pro/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY flex&roll_pro/backend/ .

# Copy built frontend into /app/static
COPY --from=frontend-build /frontend/dist /app/static

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
