
# MongoDB Atlas vs Redis Cloud — Bench Suite (All-in-One)

Este repo contiene TODO lo necesario para correr comparativas **auditable-neutral**:
- **ycsb-comparo/** → KV con YCSB (Atlas vs Redis Cloud TLS)
- **agg-bench/** → Micro-bench de Aggregations (Mongo Aggregation vs RedisJSON/RediSearch)
- **slide-tables/** → Parsers para convertir outputs a CSV “para slide”
- **.github/workflows/neutral-bench-cloud.yml** → Workflow de GitHub Actions (neutral)

## 1) Configurar Secrets (GitHub → Repo → Settings → Secrets and variables → Actions)
- `MONGO_URI` — cadena Atlas completa (con usuario y pass)
- `REDIS_HOST` — host de Redis Cloud
- `REDIS_PORT` — puerto
- `REDIS_PASSWORD` — contraseña

## 2) Correr neutral-bench-cloud
Actions → “Neutral Bench - Cloud (Atlas vs Redis Cloud)” → Run workflow → usa defaults o ajusta inputs.

Artifacts generados:
- `ycsb-raw-outputs` → archivos `.out` crudos de YCSB
- `agg-results` → `mongo_agg.csv` y `redis_agg.csv`
- (opcional) puedes correr local y usar **slide-tables** para armar tablas CSV para slides

## 3) Correr local (rápido)
### YCSB
```bash
# dentro del folder de YCSB (descargado aparte), copia los scripts de ycsb-comparo/ y haz ejecutables
chmod +x ycsb-comparo/ycsb-mongo.sh ycsb-comparo/ycsb-redis.sh
cp ycsb-comparo/*.sh .

./ycsb-mongo.sh load C 100000 64 "mongodb+srv://USER:PASS@CLUSTER/?retryWrites=true&w=majority"
./ycsb-mongo.sh run  C 120    128 "mongodb+srv://USER:PASS@CLUSTER/?retryWrites=true&w=majority" 20000

./ycsb-redis.sh load C 100000 64 -p redis.host=<HOST> -p redis.port=<PORT> -p redis.password=<PASSWORD> -p redis.ssl=true
./ycsb-redis.sh run  C 120    128 -p redis.host=<HOST> -p redis.port=<PORT> -p redis.password=<PASSWORD> -p redis.ssl=true -p target=20000
```

### Aggregations (Node 20, Redis Cloud con módulos)
```bash
cd agg-bench
npm i mongodb redis --silent
node gen_dataset.mjs --out data_100k.ndjson --count 100000 --days 7
node load_mongo.mjs "$MONGO_URI" --file data_100k.ndjson --db bench --coll events
node load_redis.mjs --file data_100k.ndjson --prefix ev: --host $REDIS_HOST --port $REDIS_PORT --password $REDIS_PASSWORD
node mongo-agg-bench.mjs "$MONGO_URI" --db bench --coll events --iters 5 --workers 8 > mongo_agg.csv
node redis-agg-bench.mjs --host $REDIS_HOST --port $REDIS_PORT --password $REDIS_PASSWORD --index idx:events --iters 5 --workers 8 > redis_agg.csv
```

### Convertir a tablas para slides
```bash
cd slide-tables
python3 ycsb_parse.py --glob "../ycsb/runs/*.out" --out ycsb_slide.csv
python3 agg_merge.py --mongo ../agg-bench/mongo_agg.csv --redis ../agg-bench/redis_agg.csv --out agg_slide_table.csv
```
