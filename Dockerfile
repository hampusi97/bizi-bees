FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
RUN pip install --no-cache-dir requests schedule

# Copy repository structure
COPY daemon/ /app/daemon/
COPY config/ /app/config/
COPY scripts/ /app/scripts/

# Create volume/directory for reports
VOLUME ["/app/reports"]

# Start the continuous 24/7 autonomous swarm
CMD ["python", "daemon/swarm_engine.py"]
