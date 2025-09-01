#!/usr/bin/env bash
set -euo pipefail
CMD=${1:-run}; WL_LETTER=${2:-A}; VALUE=${3:-300}; THREADS=${4:-256}; MONGO_URI=${5:-}; TARGET=${6:-0}
if [[ -z "${MONGO_URI}" ]]; then echo "Missing MongoDB URI" >&2; exit 1; fi
WL="workloads/workload$(echo "${WL_LETTER}" | tr '[:upper:]' '[:lower:]')"
OUTDIR="runs"; mkdir -p "${OUTDIR}"; STAMP=$(date +"%Y%m%d-%H%M%S")
OUT="${OUTDIR}/mongo_${CMD}_wl${WL_LETTER}_${STAMP}.out"
if [[ "${CMD}" == "load" ]]; then
  bin/ycsb.sh load mongodb -s -P "${WL}" -p recordcount="${VALUE}" -threads "${THREADS}" -p mongodb.url="${MONGO_URI}" | tee "${OUT}"
else
  ARGS=(-s -P "${WL}" -threads "${THREADS}" -p mongodb.url="${MONGO_URI}"); if [[ "${TARGET}" -gt 0 ]]; then ARGS+=(-target "${TARGET}"); fi
  bin/ycsb.sh run mongodb "${ARGS[@]}" -p maxexecutiontime="${VALUE}" | tee "${OUT}"
fi
echo "Saved output to ${OUT}"
