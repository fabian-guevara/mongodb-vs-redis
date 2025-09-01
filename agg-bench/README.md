
# agg-bench (Cloud)
MongoDB Aggregation vs RedisJSON/RediSearch (Redis Cloud con TLS).

## Quick
```bash
npm i mongodb redis --silent
node gen_dataset.mjs --out data_100k.ndjson --count 100000 --days 7
node load_mongo.mjs "$MONGO_URI" --file data_100k.ndjson --db bench --coll events
node load_redis.mjs --file data_100k.ndjson --prefix ev: --host $REDIS_HOST --port $REDIS_PORT --password $REDIS_PASSWORD
node mongo-agg-bench.mjs "$MONGO_URI" --db bench --coll events --iters 5 --workers 8 > mongo_agg.csv
node redis-agg-bench.mjs --host $REDIS_HOST --port $REDIS_PORT --password $REDIS_PASSWORD --index idx:events --iters 5 --workers 8 > redis_agg.csv
```
