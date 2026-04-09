FROM python:3.12-slim

WORKDIR /app

# Copy only the backend (COPY doesn't interpret & as shell metachar)
COPY flex&roll_pro/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY flex&roll_pro/backend/ .

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
