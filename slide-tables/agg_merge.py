#!/usr/bin/env python3
import argparse, pandas as pd
ap = argparse.ArgumentParser()
ap.add_argument("--mongo", required=True); ap.add_argument("--redis", required=True); ap.add_argument("--out", required=True)
args = ap.parse_args()
m = pd.read_csv(args.mongo); r = pd.read_csv(args.redis)
keep = ["engine","query_id","iters","workers","p50_ms","p95_ms","p99_ms","avg_ms","std_ms","total_ops"]
m = m[keep]; r = r[keep]
df = pd.concat([m,r], ignore_index=True)
out = df.pivot_table(index="query_id", columns="engine", values=["p95_ms","p99_ms","avg_ms"], aggfunc="first")
out.columns = [f"{metric}_{engine}" for metric, engine in out.columns]
out = out.reset_index()
out.to_csv(args.out, index=False)
print(f"Wrote {args.out}")
