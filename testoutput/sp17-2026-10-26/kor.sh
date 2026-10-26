#!/bin/sh
# SP17-mätning 2026-10-26: 3 × 3 byggen mot lokala emulatorn (npm run dev:cf).
# Kör från repo-roten:  sh testoutput/sp17-2026-10-26/kor.sh <katalog-under-testoutput/sp17-2026-10-26>
# Taket på den fria rutten (24 anrop/kvart/IP) nollställs i LOKALA D1 mellan omgångarna.
K=${1:-.}
for i in 1 2 3; do
  npx --yes wrangler@4.123.0 d1 execute DB --local --command "DELETE FROM auth_throttle" >/dev/null 2>&1
  for f in byggfirma salong fotograf; do
    SIM_BAS=http://127.0.0.1:8788 SIM_KATALOG=testoutput/sp17-2026-10-26/$K node testoutput/sim-2026-09/sim.mjs build $f-$i \
      > testoutput/sp17-2026-10-26/$K/$f-$i/bygglogg.txt 2>&1 &
  done
  wait
done
