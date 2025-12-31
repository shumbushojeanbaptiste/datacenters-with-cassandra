# Coffee Dashboard — Cassandra + Node.js

A small Node.js backend that stores coffee collections in Cassandra and exposes simple HTTP endpoints to create and list collections.

##  Project structure

- `backend/`
  - `app.js` — Express server and routes
  - `routes/collectionRoute.js` — API routes
  - `controllers/collectionController.js` — CQL queries (insert & select)
  - `models/cassandraClient.js` — Cassandra client configuration

##  Quickstart

Prerequisites:
- Node.js (16+ recommended)
- npm
- Docker (recommended for running Cassandra locally) or a local Cassandra installation

### 1) Start Cassandra (Docker, recommended)

```bash
# Pull and run Cassandra (exposes CQL on 9042)
docker pull cassandra:4.1
docker run --name cassandra -p 9042:9042 -d cassandra:4.1
# Wait ~20-40s for the node to fully initialize
```

Or install natively (Ubuntu):

```bash
sudo apt update
sudo apt install cassandra
sudo systemctl start cassandra
sudo systemctl enable cassandra
```

### 2) Verify and prepare schema

Connect to CQL shell:

```bash
docker exec -it cassandra cqlsh
# or simply cqlsh if installed locally
```

Create the keyspace and table used by this project:

```sql
CREATE KEYSPACE IF NOT EXISTS coffee_app
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE coffee_app;

CREATE TABLE IF NOT EXISTS collections (
  collection_id uuid PRIMARY KEY,
  farmer_name text,
  station_id text,
  weight float,
  price float,
  created_at timestamp
);
```

> Note: The current table is simple and uses `collection_id` as the primary key. This allows straightforward inserts and full-table selects but is not optimized for queries like "top farmers by weight" without additional data modeling.

### 3) Install and run the backend

```bash
cd backend
npm install
# start the server
node app.js
# (optional) add a start script to package.json: "start": "node app.js" and run `npm start`
```

The server listens on port `3001` and connects to `127.0.0.1:9042` by default (see `models/cassandraClient.js`). If Cassandra runs in Docker and the backend runs on the host, the default contact point works because port 9042 is published.

## 🔌 API

- POST /api/collections — create a collection
  - Request body (JSON): `{ "farmer_name":"Ana", "station_id":"S1", "weight":12.5, "price":3.2 }`

Example:

```bash
curl -X POST http://localhost:3001/api/collections \
  -H 'Content-Type: application/json' \
  -d '{"farmer_name":"Ana","station_id":"S1","weight":12.5,"price":3.2}'
```

- GET /api/collections — list all collections

```bash
curl http://localhost:3001/api/collections
```

Internally, `POST /api/collections` uses a prepared `INSERT` statement and `GET /api/collections` runs:

```sql
SELECT * FROM collections;
```

## 🔝 Top / useful queries

The app currently issues `SELECT * FROM collections` to get all rows. For interactive inspection in `cqlsh`:

```sql
USE coffee_app;
SELECT * FROM collections LIMIT 10;
```

If you want a simple "top" example (e.g., top farmers by total weight), you can run an aggregate query for testing, but keep these caveats in mind:

- Aggregations (SUM, COUNT, GROUP BY) are supported in CQL but can be expensive on large datasets.
- Cassandra is optimized for pre-modeled query patterns. For frequent "top N" queries, create a dedicated table or materialized view that stores the aggregated totals by farmer or station.

Example aggregate (works for small datasets or testing only):

```sql
-- Warning: may be slow on large clusters
SELECT farmer_name, sum(weight) AS total_weight
FROM collections
GROUP BY farmer_name;
```

Alternative (quick & dirty):

```sql
-- Not recommended for production: filters and full scans
SELECT * FROM collections WHERE weight > 0 ALLOW FILTERING LIMIT 10;
```

Better approach (recommended): create an aggregate table and update it at write time:

```sql
CREATE TABLE totals_by_farmer (
  farmer_name text PRIMARY KEY,
  total_weight double
);
-- Increment total_weight from application code when inserting collections
```

## Troubleshooting & tips

- Connection issues: if the backend runs inside a container or another machine, adjust `contactPoints` in `backend/models/cassandraClient.js` to the Cassandra node's reachable IP.
- If you're using Docker Compose or multiple nodes, set `localDataCenter` appropriately and use multiple contact points.
- Avoid `ALLOW FILTERING` in production; instead, model your tables for your queries.
- Add `start` script to `backend/package.json` for convenience:

```json
"scripts": {
  "start": "node app.js"
}
```

##  Files to inspect for query behavior

- `backend/models/cassandraClient.js` — client config (contact points, data center, keyspace)
- `backend/controllers/collectionController.js` — insert and select logic
- `backend/app.js` — server and routes

---

other tips for cassandra basic querys and usage can be found in the [Cassandra documentation](https://cassandra.apache.org/doc/latest/).

cqlsh: cassandra query language shell reference [here](https://cassandra.apache.org/doc/latest/cql/).
to show keyspaces: `DESCRIBE KEYSPACES;`
to show tables in a keyspace: `DESCRIBE TABLES;`
to show table schema: `DESCRIBE TABLE <table_name>;`
to exit cqlsh: `EXIT;` or `QUIT;`
to see help in cqlsh: `HELP;` or `?;`
to clear the screen in cqlsh: `CLS;` (Windows) or `CLEAR;` (Linux/Mac)
to see current keyspace: `SHOW KEYSPACE;`
to change keyspace: `USE <keyspace_name>;`
row limit: `SELECT * FROM <table_name> LIMIT <number>;`
to count rows: `SELECT COUNT(*) FROM <table_name>;`

if friendly with mysql, note that cassandra does not support joins between tables like mysql does. instead, data should be modeled to fit query patterns.



If you want, I can also add a `start` script to `backend/package.json` and include a short seed script to populate sample data for testing. 
