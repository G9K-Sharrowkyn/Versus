import { readFileSync, writeFileSync } from 'fs';

const filePath = 'f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/anime/the-cyberpunk-station-for-netrunners/dist/bundle.js';
let src = readFileSync(filePath, 'utf8');

const replacements = [
  // 1. Alert banner
  [
    'WARNING: HTTP ERROR 401',
    'ALERT: NEXUS-SEC CODE 0x401'
  ],
  // 2. Big unauthorized message
  [
    'YOU ARE NOT AUTHORIZED TO ACCESS THIS DOMAIN',
    'ACCESS DENIED — CORP MAINFRAME NEXUS-7 LOCKED'
  ],
  // 3. Breach button label
  [
    'INITIATE BREACH PROTOCOL',
    'RUN BREACH.EXE — ICEPICK MODE'
  ],
  // 4a. INVOKING → EXECUTING
  [
    'INVOKING\\n                ',
    'EXECUTING\\n                '
  ],
  // 4b. CIRCUIT BREAKER (inside <a> tag textContent)
  [
    '_.textContent="CIRCUIT BREAKER"',
    '_.textContent="DIRTY_PIPE"'
  ],
  // 4c. SUBROUTINE → EXPLOIT
  [
    '\\n                SUBROUTINE',
    '\\n                EXPLOIT'
  ],
  // 5. hydra.h static text in breachBox1
  [
    'from hydra.h:3, from hydra-mod.h:4, from sasl.h:2, from\\n                        sasl.c:1: /usr/include/x86_64-linux-gnu/bits/stdio2.h:67:10:\\n                        note: \'__builtin___snp',
    'from nexus_core.h:3, from icepick.h:4, from breach_proto.h:2, from\\n                        dirty_pipe.c:1: /nexus/exploit/breach_engine/pipe_inject.h:67:10:\\n                        note: \'__nexus_pipe_chk'
  ],
];

let count = 0;
for (const [from, to] of replacements) {
  if (src.includes(from)) {
    src = src.replace(from, to);
    console.log(`OK: "${from.slice(0, 50)}" -> "${to.slice(0, 50)}"`);
    count++;
  } else {
    console.log(`MISS: "${from.slice(0, 60)}"`);
  }
}

writeFileSync(filePath, src, 'utf8');
console.log(`\n${count}/${replacements.length} replacements applied.`);
