
#!/usr/bin/env bash
set -euo pipefail
# Usage: ./parse_ycsb_to_csv.sh ycsb/runs/*.out > ycsb_slide.csv
FILES=("$@")
TMP="ycsb_slide.csv"
python3 ycsb_parse.py --glob "${FILES[*]}" --out "$TMP"
cat "$TMP"
