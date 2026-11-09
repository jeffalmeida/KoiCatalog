#!/bin/sh
set -e
# Volumes montados costumam vir como root; o app roda como node.
mkdir -p /app/public/images/uploads /app/data
chown -R node:node /app/public/images/uploads /app/data
exec su-exec node "$@"
