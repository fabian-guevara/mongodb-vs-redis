#!/usr/bin/env bash
set -euo pipefail
CMD=${1:-run}; WL_LETTER=${2:-A}; VALUE=${3:-300}; THREADS=${4:-256}; shift 4 || true; EXTRA_ARGS=("$@")
WL="workloads/workload$(echo "${WL_LETTER}" | tr '[:upper:]' '[:lower:]')"
OUTDIR="runs"; mkdir -p "${OUTDIR}"; STAMP=$(date +"%Y%m%d-%H%M%S")
OUT="${OUTDIR}/redis_${CMD}_wl${WL_LETTER}_${STAMP}.out"
if [[ "${CMD}" == "load" ]]; then
  bin/ycsb.sh load redis -s -P "${WL}" -threads "${THREADS}" "${EXTRA_ARGS[@]}" | tee "${OUT}"
else
  bin/ycsb.sh run redis -s -P "${WL}" -threads "${THREADS}" -p maxexecutiontime="${VALUE}" "${EXTRA_ARGS[@]}" | tee "${OUT}"
fi
echo "Saved output to ${OUT}"
