
#!/usr/bin/env python3
Parse YCSB .out files into a slide-friendly CSV.

Usage:
  python ycsb_parse.py --glob "ycsb/runs/*.out" --out ycsb_summary.csv --system mongo --workload C --threads 512 --target 50000
  (You can override metadata per file using CLI flags or let the script infer from filename patterns like mongo_run_wlC_*.out)

It extracts:
  - OVERALL Throughput(ops/sec)
  - p95/p99 per operation (READ/UPDATE/INSERT/SCAN/READMODIFYUPDATE) if present.

import argparse, glob, os, re, csv, sys

PAT_OVERALL = re.compile(r"OVERALL.+Throughput\(.+?sec\),\s*([\d\.]+)")
PAT_METRIC = re.compile(r"^\[(READ|UPDATE|INSERT|SCAN|READMODIFYUPDATE)\],\s*(\d{1,2}(?:st|nd|rd|th)?PercentileLatency\(us\)|AverageLatency\(us\)|MaxLatency\(us\)),\s*([\d\.]+)")

def infer_from_name(path):
    base = os.path.basename(path)
    # e.g., mongo_run_wlC_20250101-120000.out
    m = re.search(r"(mongo|redis)_(load|run)_wl([A-Z])_", base, re.I)
    system = m.group(1).lower() if m else ""
    phase = m.group(2).lower() if m else ""
    workload = m.group(3).upper() if m else ""
    return system, phase, workload

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--glob", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--system", default="")    # override if desired
    ap.add_argument("--workload", default="")
    ap.add_argument("--threads", default="")
    ap.add_argument("--target", default="")
    ap.add_argument("--recordcount", default="")
    ap.add_argument("--maxexecutiontime", default="")
    args = ap.parse_args()

    rows = []
    for path in glob.glob(args.glob):
        with open(path, "r", errors="ignore") as f:
            overall = ""
            metrics = {}  # op -> {avg,p95,p99,max}
            for line in f:
                m = PAT_OVERALL.search(line)
                if m: overall = m.group(1)

                m2 = PAT_METRIC.match(line.strip())
                if m2:
                    op = m2.group(1)
                    name = m2.group(2)
                    val_us = float(m2.group(3))
                    d = metrics.setdefault(op, {"avg_ms":"", "p95_ms":"", "p99_ms":"", "max_ms":""})
                    if name.startswith("AverageLatency"):
                        d["avg_ms"] = f"{val_us/1000:.2f}"
                    elif name.startswith("95th"):
                        d["p95_ms"] = f"{val_us/1000:.2f}"
                    elif name.startswith("99th"):
                        d["p99_ms"] = f"{val_us/1000:.2f}"
                    elif name.startswith("MaxLatency"):
                        d["max_ms"] = f"{val_us/1000:.2f}"

        system, phase, workload = infer_from_name(path)
        if args.system: system = args.system
        if args.workload: workload = args.workload

        row = {
            "file": os.path.basename(path),
            "system": system,
            "phase": phase,
            "workload": workload,
            "threads": args.threads,
            "target_ops": args.target,
            "recordcount": args.recordcount,
            "maxexecutiontime_sec": args.maxexecutiontime,
            "throughput_ops_sec": overall or "",
        }
        # flatten per-op p95/p99 for slide (focus on READ/UPDATE/INSERT)
        for op in ["READ","UPDATE","INSERT","READMODIFYUPDATE","SCAN"]:
            d = metrics.get(op, {})
            row[f"{op.lower()}_p95_ms"] = d.get("p95_ms","")
            row[f"{op.lower()}_p99_ms"] = d.get("p99_ms","")
        rows.append(row)

    # write CSV
    if not rows:
        print("No input matched or no metrics parsed.", file=sys.stderr)
        sys.exit(2)

    cols = ["file","system","phase","workload","threads","target_ops","recordcount","maxexecutiontime_sec","throughput_ops_sec",
            "read_p95_ms","read_p99_ms","update_p95_ms","update_p99_ms","insert_p95_ms","insert_p99_ms","readmodifyupdate_p95_ms","readmodifyupdate_p99_ms","scan_p95_ms","scan_p99_ms"]
    with open(args.out, "w", newline="") as out:
        w = csv.DictWriter(out, fieldnames=cols)
        w.writeheader()
        for r in rows:
            w.writerow(r)

if __name__ == "__main__":
    main()
