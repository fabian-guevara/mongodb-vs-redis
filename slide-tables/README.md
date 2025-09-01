
# slide-tables
Convierte outputs a CSV para slides.

## YCSB → CSV
```bash
python3 ycsb_parse.py --glob "../ycsb/runs/*.out" --out ycsb_slide.csv
```

## Aggregations → CSV
```bash
python3 agg_merge.py --mongo ../agg-bench/mongo_agg.csv --redis ../agg-bench/redis_agg.csv --out agg_slide_table.csv
```
