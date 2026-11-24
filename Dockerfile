# Standalone Radiate (Raspberry Pi, any Docker host). Multi-arch via the base image.
FROM python:3.13-slim
# Add SAML login with --build-arg RADIATE_EXTRAS=server,saml (docs/deployment.md).
ARG RADIATE_EXTRAS=server
WORKDIR /src
COPY pyproject.toml README.md LICENSE ./
COPY src ./src
COPY web ./web
COPY shelly ./shelly
RUN pip install --no-cache-dir ".[${RADIATE_EXTRAS}]" && rm -rf /src
EXPOSE 8099
CMD ["radiate", "serve", "--demo", "--speed", "1"]
