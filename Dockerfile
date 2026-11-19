# Standalone Radiate (Raspberry Pi, any Docker host). Multi-arch via the base image.
FROM python:3.13-slim
WORKDIR /src
COPY pyproject.toml README.md LICENSE ./
COPY src ./src
COPY web ./web
COPY shelly ./shelly
RUN pip install --no-cache-dir ".[server]" && rm -rf /src
EXPOSE 8099
CMD ["radiate", "serve", "--demo", "--speed", "1"]
