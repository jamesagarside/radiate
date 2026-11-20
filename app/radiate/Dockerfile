ARG BUILD_FROM=python:3.13-slim
FROM ${BUILD_FROM}

# The Supervisor builds with this folder as context, so install Radiate from source.
ARG RADIATE_REF=v0.1.0
RUN pip install --no-cache-dir \
    "radiate[server] @ https://github.com/jamesagarside/radiate/archive/${RADIATE_REF}.tar.gz"

COPY run.py /run.py
ENV RADIATE_INGRESS_IP=172.30.32.2
CMD ["python", "-u", "/run.py"]
