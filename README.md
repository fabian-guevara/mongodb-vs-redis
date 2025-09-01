
# Slide Tables Helpers

## YCSB → CSV (slide-ready)
```bash
python3 ycsb_parse.py --glob "ycsb/runs/*.out" --out ycsb_slide.csv
# or set metadata if needed:
python3 ycsb_parse.py --glob "ycsb/runs/mongo_run_wlC_*.out" --out ycsb_mongo.csv --system mongo --workload C --threads 512 --target 50000
```

The CSV includes:
`file, system, phase, workload, threads, target_ops, recordcount, maxexecutiontime_sec, throughput_ops_sec, read_p95_ms, read_p99_ms, update_p95_ms, update_p99_ms, insert_p95_ms, insert_p99_ms, readmodifyupdate_p95_ms, readmodifyupdate_p99_ms, scan_p95_ms, scan_p99_ms`

## Aggregations → merged slide table
```bash
python3 agg_merge.py --mongo mongo_agg.csv --redis redis_agg.csv --out agg_slide_table.csv
```
Generates a compact table with rows per `query_id` and columns: `p95_ms_mongo, p99_ms_mongo, avg_ms_mongo, p95_ms_redis, p99_ms_redis, avg_ms_redis`.
