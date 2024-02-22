# Phala Computation Squid

## Deploy with docker compose

[phala-computation](https://hub.docker.com/repository/docker/kdon1204/phala-computation/general)

[khala-computation](https://hub.docker.com/repository/docker/kdon1204/khala-computation/general)

```yml
version: '3'

services:
  processor:
    image: kdon1204/khala-computation:next
    restart: unless-stopped
    environment:
      DB_HOST: db
      DB_NAME: squid
      DB_PASS: squid
      DB_PORT: 5432
      PROCESSOR_PROMETHEUS_PORT: 3001
      CLEAR_WITHDRAWAL_DATE: 2023-11-15T00:00:00Z
      CLEAR_WITHDRAWAL_THRESHOLD: 0.01
      RPC_ENDPOINT:
      ENABLE_SNAPSHOT: 1
    logging:
      options:
        max-size: '100m'
    depends_on:
      - db

  server:
    image: kdon1204/khala-computation:next
    restart: unless-stopped
    environment:
      DB_HOST: db
      DB_NAME: squid
      DB_PASS: squid
      # DB_PORT: 5432
      GQL_PORT: 4350
    command:
      [
        'sh',
        '-c',
        'bunx squid-graphql-server --dumb-cache in-memory --dumb-cache-ttl 1000 --dumb-cache-size 100 --dumb-cache-max-age 1000',
      ]
    logging:
      options:
        max-size: '100m'
    depends_on:
      - db

  db:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_DB: squid
      POSTGRES_PASSWORD: squid
    shm_size: 1gb
    logging:
      options:
        max-size: '100m'
    command: ['postgres', '-c', 'max_connections=1024']
    volumes:
      - db:/var/lib/postgresql/data

volumes:
  db:
```
