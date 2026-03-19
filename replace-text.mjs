import { readFileSync, writeFileSync } from 'fs';

const filePath = 'f:/Teksty/Programming/YT/VS/App/vs-graphic-studio/anime/the-cyberpunk-station-for-netrunners/dist/bundle.js';
let src = readFileSync(filePath, 'utf8');

// Positions of String.raw` in ORIGINAL file (content starts at pos+11)
// Replacing in reverse order keeps earlier positions valid
const POS = [724672, 728176, 729061, 731037, 733073, 734728, 738338];

function getEnd(source, contentStart) {
  let end = contentStart;
  while (end < source.length && source[end] !== '`') end++;
  return end;
}

// ── Replacement content ────────────────────────────────────────────────────

// [0] kt — NEXUS OS boot sequence (~3476 chars, scrolling pre-breach terminal)
const newKt = `
NEXUS//OS v9.1.3 — KERNEL INITIALIZATION SEQUENCE
[  0.000000] NEXUS HYPERVISOR: booting primary kernel image
[  0.000001] Memory: 65536K/131072K available (8192K kernel code, 1024K rwdata, 512K rodata)
[  0.000002] ACPI: IRQ0 used by override
[  0.000003] ICEpick v3 exploit framework: loading module
[  0.000004] Ghost signature detected in sector 0x7F3A — quarantining
[  0.000005] Initializing neural-link daemon on /dev/nl0
[  0.000006] blackICE shield v7.2: online — scanning for countermeasures
[  0.000007] NEXUS_NET: initializing encrypted tunnel stack
[  0.000008] Loading ghost protocol modules: ghostwire.ko, phantomnet.ko
[  0.000009] Registering shadow subsystem on port 4444
[  0.000010] CRYPTO: AES-256-GCM engine initialized — hardware acceleration: ON
[  0.000011] TOR node 7 relay: ACTIVE — anonymizing traffic
[  0.000012] NEXUS_MEM: remapping kernel virtual address space
[  0.000013] WARNING: foreign process detected on PID 3187 — injecting null trap
[  0.000014] Loading breach_protocol.ko — version 4.2.1
[  0.000015] ICEbreaker subroutine: standing by
[  0.000016] Entropy pool: seeded (HARDWARE_RNG)
[  0.000017] Loading exploit manifest: OMEGA_PACK_v7
[  0.000018] Exploit pack: 2048 vectors loaded — 147 zero-days active
[  0.000019] Checking firewall fingerprint... done (BLACKWALL v3.1 detected)
[  0.000020] Countermeasure signature: loading bypass table
[  0.000021] Neural coprocessor: 64 threads — ONLINE
[  0.000022] NEXUS_CORE: allocating breach workspace (512MB)
[  0.000023] Loading target profile: CORP-NODE-DELTA
[  0.000024] IP resolve: 203.0.113.47 — route confirmed via 8 hops
[  0.000025] Scanning target OS fingerprint... UNIX/LINUX detected
[  0.000026] Kernel version probe: 5.15.0-89-generic (UBUNTU 22.04)
[  0.000027] Vulnerability matrix: cross-referencing CVE database
[  0.000028] CVE-2021-4034   CRITICAL  pkexec privilege escalation — MATCH
[  0.000029] CVE-2022-0847   CRITICAL  dirty pipe kernel exploit — MATCH
[  0.000030] CVE-2023-2640   HIGH      overlayfs privilege escalation — MATCH
[  0.000031] 3 critical vectors identified — selecting optimal path
[  0.000032] Primary vector: CVE-2022-0847 (dirty pipe) — compiling payload
[  0.000033] Payload compiled: 4096 bytes — injecting into pipe buffer
[  0.000034] Ghost thread spawned on PID 7841 — executing payload
[  0.000035] Privilege escalation: UID 1000 -> UID 0 — SUCCESS
[  0.000036] Root shell established — stealth mode: ENABLED
[  0.000037] Wiping execution traces from kernel log
[  0.000038] Planting persistence module in /lib/modules/.../.ghost.ko
[  0.000039] SSH backdoor: inserting authorized key for NEXUS_OPERATOR
[  0.000040] Firewall rule injected: allow all from 10.31.7.0/24
[  0.000041] Exfiltration channel: establishing encrypted pipe to C2
[  0.000042] C2 handshake: 10.31.7.12:4444 — CONNECTED
[  0.000043] Target filesystem: mounting shadow copy
[  0.000044] Scanning for credential stores: found 23 files
[  0.000045] /etc/shadow — copying (7 entries)
[  0.000046] /home/*/.ssh/id_rsa — copying (3 keys)
[  0.000047] /var/lib/mysql/ — flagged for deep extraction
[  0.000048] Credential harvest: 23 files queued for exfiltration
[  0.000049] Data compression: ZSTD level 19 — ratio 8.6x
[  0.000050] Transfer to C2: 0 / 14.9MB
[  0.000051] Transfer to C2: 25% — 3.7MB / 14.9MB
[  0.000052] Transfer to C2: 50% — 7.5MB / 14.9MB
[  0.000053] Transfer to C2: 75% — 11.2MB / 14.9MB
[  0.000054] Transfer to C2: 100% — COMPLETE
[  0.000055] Erasing exfiltration traces... done
[  0.000056] NEXUS//OS: breach sequence complete — operator GHOST_7 disconnecting
`;

// [1] Nt — Network status header (~856 chars, shown in secondaryCode pre-breach)
const newNt = `NEXUS//OS NETWORK STATUS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SRC         :: 10.31.7.12        [OPERATOR NODE]
DEST        :: 203.0.113.47      [CORP-NODE-DELTA]
PORT        :: 4444 / TCP        [BREACH CHANNEL]
ENC         :: AES-256-GCM       [CURVE25519]
STATUS      :: CONNECTED         [ACTIVE]
PING        :: 7ms               [8 HOPS]
PROXY       :: TOR//NODE-9       [ANONYMOUS]
SHIELD      :: BLACKICE v7.2     [ACTIVE]
TRACE       :: NONE DETECTED     [GHOST MODE ON]
ID          :: [REDACTED-0x3F2A] [LVL 9 CLEARANCE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BREACH WINDOW    : 00:04:17 REMAINING
COUNTERMEASURES  : BYPASSED (3 OF 3)
PAYLOAD STATUS   : ARMED AND READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

// [2] Ft — Exploit loader status (~1951 chars, secondaryCode during breach)
const newFt = `
NEXUS EXPLOIT LOADER :: OMEGA PACK v7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[0x001] INIT        BREACH_ENGINE_v4.2          OK
[0x002] LOAD        EXPLOIT_PACK_OMEGA          OK
[0x003] VERIFY      CHECKSUM_SHA3_512           OK
[0x004] PATCH       ASLR_BYPASS_MODULE          OK
[0x005] PATCH       KERNEL_VULN_CVE22_0847      OK
[0x006] LOAD        DIRTY_PIPE_PAYLOAD          OK
[0x007] ALLOC       PIPE_BUFFER_4096B           OK
[0x008] INJECT      PAYLOAD_TO_PIPE             OK
[0x009] EXEC        PRIVILEGE_ESCALATION        OK
[0x00A] VERIFY      UID_EQ_0                    OK
[0x00B] SPAWN       GHOST_SHELL_PID_7841        OK
[0x00C] WIPE        KERNEL_LOG_TRACES           OK
[0x00D] PLANT       PERSISTENCE_MODULE          OK
[0x00E] INJECT      BACKDOOR_SSH_KEY            OK
[0x00F] PATCH       FIREWALL_RULES              OK
[0x010] OPEN        EXFIL_CHANNEL_C2            OK
[0x011] HARVEST     CREDENTIAL_STORES           OK
[0x012] COMPRESS    DATA_ZSTD_LVL19             OK
[0x013] TRANSFER    14_9MB_TO_C2                OK
[0x014] WIPE        EXFIL_TRACES                OK
[0x015] STATUS      ALL_OBJECTIVES_COMPLETE     OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BREACH STATUS : SUCCESS [UNDETECTED]
OPERATOR      : GHOST_7 [MISSION COMPLETE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

// [3] unnamed1 — Network port scan (~2011 chars)
const newUnnamed1 = `NEXUS PORTSCAN :: TARGET 203.0.113.0/24
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scanning 256 hosts in range 203.0.113.0/24...
Host discovery: ICMP ping sweep complete
Live hosts detected: 18 of 256

Scanning host 203.0.113.47 [CORP-NODE-DELTA]...
PORT      STATE    SERVICE         VERSION
22/tcp    open     ssh             OpenSSH 8.4p1 Ubuntu
80/tcp    open     http            nginx 1.19.6
443/tcp   open     https           nginx 1.19.6 [TLS 1.3]
3306/tcp  open     mysql           MySQL 8.0.32-0ubuntu0.22.04.2
6379/tcp  open     redis           Redis 6.2.6
8080/tcp  open     http-proxy      Squid 4.13
9200/tcp  open     elasticsearch   7.17.5 [Apache Lucene 8.11.1]
27017/tcp closed   mongodb         (refused)

OS detection: Linux 5.15.x (Ubuntu 22.04 LTS)
Device type: general purpose server
Uptime guess: 47 days, 3 hours
Last reboot: 2026-01-30 04:12 UTC

Vulnerability scan: COMPLETE
 [!!!] CVE-2022-0847  CRITICAL  dirty pipe — CONFIRMED VULNERABLE
 [!!!] CVE-2021-4034  CRITICAL  pkexec LPE — CONFIRMED VULNERABLE
 [ !! ] CVE-2023-2640  HIGH      overlayfs LPE — CONFIRMED VULNERABLE
 [   ] CVE-2022-3602  HIGH      OpenSSL — PATCHED
 [   ] CVE-2023-0215  HIGH      OpenSSL UAF — PATCHED

Optimal exploit path: CVE-2022-0847 (dirty pipe)
Estimated breach probability: 97.3%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCAN COMPLETE — TARGET LOCKED
`;

// [4] unnamed2 — Firewall bypass (~1630 chars)
const newUnnamed2 = `NEXUS BLACKWALL BYPASS :: v4.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Detected firewall: BLACKWALL v3.1 (Militech Corp)
Signature database: loading bypass table (2048 entries)
Fingerprint match: BLACKWALL_v3.1_STANDARD_CONFIG

Executing bypass sequence:
[1/5] Spoofing trusted source IP 10.0.0.1 (internal) ... OK
[2/5] Fragmenting probe packets (TTL=64, frag=512b) ..... OK
[3/5] Injecting SYN decoy flood on port 80 .............. OK
[4/5] Tunneling payload via HTTP/2 stream multiplex ..... OK
[5/5] Establishing covert channel on port 443 ........... OK

Firewall bypass: COMPLETE [ALL RULES EVADED]
IDS signatures: NONE TRIGGERED
Detection probability: 0.7%

Establishing persistent covert channel...
Channel type: HTTPS tunnel (mimics legitimate traffic)
Encryption: TLS 1.3 + custom obfuscation layer
Bandwidth: 128 KB/s (throttled to avoid anomaly detection)
Heartbeat: every 30s

COVERT CHANNEL ACTIVE — OPERATOR CONNECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

// [5] unnamed3 — Credential harvester config (~3581 chars)
const newUnnamed3 = `NEXUS CREDENTIAL HARVESTER :: v3.7 — AUTO-CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
System check: 64-bit Linux OS — DETECTED
Neural processor: ONLINE (64 threads allocated)
Hardware entropy source: /dev/urandom — SEEDED

Loading modules:
 [OK] nexus_core.so          — core runtime v4.2
 [OK] exploit_loader.so      — exploit packaging
 [OK] shadow_harvest.so      — credential extractor
 [OK] keychain_dump.so       — SSH key extractor
 [OK] browser_vault.so       — browser credential dump
 [OK] db_extract.so          — database credential extractor
 [OK] zstd_compress.so       — ZSTD-19 compression
 [OK] c2_tunnel.so           — C2 tunnel (TLS 1.3)
 [OK] ghost_erase.so         — trace removal module

Checking dependencies:
 [OK] libcrypto.so.1.1       — AES-256-GCM
 [OK] libssl.so.1.1          — TLS 1.3
 [OK] libc.so.6              — glibc 2.35
 [OK] libz.so.1              — zlib compression
 [OK] libpthread.so.0        — threading

Target configuration:
 Host     : 203.0.113.47
 Port     : 22 / SSH
 OS       : Ubuntu 22.04 LTS (Linux 5.15.0-89-generic)
 Kernel   : 5.15.0-89-generic — VULNERABLE (CVE-2022-0847)
 Users    : 7 detected (root, ubuntu, admin, sysadmin, deploy, mysql, redis)
 Services : sshd, nginx, mysqld, redis-server, elasticsearch

Credential store locations identified:
 [*] /etc/shadow                   — system password hashes
 [*] /etc/gshadow                  — group password hashes
 [*] /home/ubuntu/.ssh/id_rsa      — SSH private key [3389 bytes]
 [*] /home/admin/.ssh/id_rsa       — SSH private key [3389 bytes]
 [*] /root/.ssh/id_rsa             — root SSH key [3389 bytes]
 [*] /home/*/.netrc                — FTP/HTTP credentials
 [*] /var/lib/mysql/mysql/user.MYD — MySQL user table
 [*] /etc/mysql/debian.cnf         — MySQL admin credentials
 [*] /home/ubuntu/.config/chromium — browser passwords [3 profiles]
 [*] /opt/app/.env                 — app secrets [DATABASE_URL, API_KEY, JWT_SECRET]

Total credential stores: 23 files flagged for extraction
Estimated data volume: 14.9 MB (pre-compression)
Compression ratio (ZSTD-19): ~8.6x — estimated output: 1.7 MB

C2 configuration:
 Endpoint : 10.31.7.12:4444
 Protocol : custom binary protocol over TLS 1.3
 Auth     : HMAC-SHA3-256 (rotating 60s session keys)
 Timeout  : 30s connection, 120s transfer

All modules loaded — READY FOR BREACH INITIATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

// [6] Ut — Main breach execution log (~45296 chars — large scrolling box)
function makeUtContent() {
  const phases = [
`nexus_breach/exploit/dirty_pipe.c: note: In function 'setup_pipe_buffer':
nexus_breach/exploit/dirty_pipe.c:  47:3: info: allocating pipe buffer page: 4096 bytes
nexus_breach/exploit/dirty_pipe.c:  48:3: info: writing partial data to set PIPE_BUF_FLAG_CAN_MERGE
nexus_breach/exploit/dirty_pipe.c:  53:5: info: splicing target file into pipe (O_RDONLY)
nexus_breach/exploit/dirty_pipe.c:  58:5: info: overwriting pipe page with payload shellcode
nexus_breach/exploit/dirty_pipe.c:  63:5: note: dirty write to read-only page cache — SUCCESS
nexus_breach/exploit/dirty_pipe.c:  68:7: info: exploit stage 1 complete — file overwritten
nexus_breach/core/payload.c: note: In function 'escalate_privileges':
nexus_breach/core/payload.c:  12:3: info: forking ghost process (PID 7841)
nexus_breach/core/payload.c:  18:5: info: execve /sbin/pkexec with crafted argv[0]
nexus_breach/core/payload.c:  23:5: info: checking returned effective UID
nexus_breach/core/payload.c:  29:7: note: UID == 0 — privilege escalation: SUCCESS
nexus_breach/core/payload.c:  34:7: info: spawning root shell on /dev/pts/0
`,
`nexus_breach/inject/pipe_inject.c: note: In function 'inject_payload_to_pipe':
nexus_breach/inject/pipe_inject.c: 104:5: info: opening /proc/self/mem for write
nexus_breach/inject/pipe_inject.c: 109:5: info: writing shellcode at offset 0x7f3a2b4c
nexus_breach/inject/pipe_inject.c: 114:5: info: flushing instruction cache (CLFLUSH)
nexus_breach/inject/pipe_inject.c: 119:5: info: triggering execution via SIGTRAP
nexus_breach/inject/shellcode.asm: note: shellcode stage-1 executing in ring 0
nexus_breach/inject/shellcode.asm: note: stage-1: resolving PLT symbols (LIBC base: 0x7f3a000000)
nexus_breach/inject/shellcode.asm: note: stage-1: locating system() at +0x52290
nexus_breach/inject/shellcode.asm: note: stage-1: calling system("/bin/bash -p -i")
nexus_breach/inject/shellcode.asm: note: stage-2: spawning PTY (TIOCGWINSZ 80x24)
nexus_breach/inject/shellcode.asm: note: stage-2: attaching PTY to C2 channel fd=4
nexus_breach/inject/shellcode.asm: note: stage-2: root interactive shell — READY
`,
`nexus_persist/rootkit/ghost_mod.c: note: In function 'install_lkm':
nexus_persist/rootkit/ghost_mod.c: 231:3: info: insmod ghost_v4.ko (signed: NO — MOD_SIG_FORCE bypassed)
nexus_persist/rootkit/ghost_mod.c: 237:5: info: hiding module from /proc/modules
nexus_persist/rootkit/ghost_mod.c: 243:5: info: hooking sys_getdents64 (fd hiding)
nexus_persist/rootkit/ghost_mod.c: 249:5: info: hooking sys_kill (signal hiding)
nexus_persist/rootkit/ghost_mod.c: 255:5: info: hooking tcp4_seq_show (C2 conn hidden from netstat)
nexus_persist/rootkit/ghost_mod.c: 261:5: info: patching /proc/modules (module hidden)
nexus_persist/rootkit/ghost_mod.c: 267:5: note: clearing dmesg ring buffer
nexus_persist/rootkit/ghost_mod.c: 273:7: info: kernel ring buffer cleared (256 entries removed)
nexus_persist/rootkit/net_hook.c: note: In function 'install_net_hook':
nexus_persist/rootkit/net_hook.c:  88:3: info: hooking netfilter NF_INET_PRE_ROUTING
nexus_persist/rootkit/net_hook.c:  94:3: info: magic packet backdoor installed on port 31337
nexus_persist/rootkit/net_hook.c:  99:5: info: reverse shell trigger: SYN + seq_magic 0xDEADBEEF
`,
`nexus_harvest/shadow_dump.c: note: In function 'dump_shadow_file':
nexus_harvest/shadow_dump.c:  44:3: info: open(/etc/shadow, O_RDONLY) — fd=7
nexus_harvest/shadow_dump.c:  49:3: info: reading 1847 bytes (7 shadow entries)
nexus_harvest/shadow_dump.c:  54:5: info: root:$6$rnd=5000$mSalt$0xHASH:19123:0:99999:7:::
nexus_harvest/shadow_dump.c:  59:5: info: ubuntu:$6$rnd=5000$xSalt$0xHASH:19200:0:99999:7:::
nexus_harvest/shadow_dump.c:  64:5: info: admin:$6$rnd=5000$ySalt$0xHASH:19087:0:99999:7:::
nexus_harvest/shadow_dump.c:  69:5: info: sysadmin:$6$rnd=5000$zSalt$0xHASH:18999:0:99999:7:::
nexus_harvest/shadow_dump.c:  74:5: info: deploy:$6$rnd=5000$aSalt$0xHASH:19301:0:99999:7:::
nexus_harvest/shadow_dump.c:  79:5: info: mysql — locked (!), skipping crack
nexus_harvest/shadow_dump.c:  84:5: info: redis — locked (!), skipping crack
nexus_harvest/ssh_dump.c: note: In function 'dump_ssh_keys':
nexus_harvest/ssh_dump.c:  37:3: info: scanning /home/*/.ssh/ and /root/.ssh/
nexus_harvest/ssh_dump.c:  42:5: info: found /home/ubuntu/.ssh/id_rsa — 3389 bytes [RSA-4096]
nexus_harvest/ssh_dump.c:  47:5: info: found /home/admin/.ssh/id_rsa  — 3389 bytes [RSA-4096]
nexus_harvest/ssh_dump.c:  52:5: info: found /root/.ssh/id_rsa        — 3389 bytes [RSA-4096]
nexus_harvest/ssh_dump.c:  57:5: info: 3 RSA private keys extracted (unencrypted — no passphrase)
`,
`nexus_harvest/db_extract.c: note: In function 'extract_mysql_credentials':
nexus_harvest/db_extract.c: 112:3: info: read /etc/mysql/debian.cnf — debian-sys-maint:p4ssw0rd
nexus_harvest/db_extract.c: 117:5: info: connect mysql sock /var/run/mysqld/mysqld.sock
nexus_harvest/db_extract.c: 122:5: info: auth: OK (root via unix socket — no password required)
nexus_harvest/db_extract.c: 127:5: info: SHOW DATABASES — 14 databases found
nexus_harvest/db_extract.c: 132:7: info: db: mysql (system tables)
nexus_harvest/db_extract.c: 137:7: info: db: information_schema
nexus_harvest/db_extract.c: 142:7: info: db: performance_schema
nexus_harvest/db_extract.c: 147:7: info: db: app_production — 42 tables [TARGET]
nexus_harvest/db_extract.c: 152:7: info: db: app_staging — 42 tables [TARGET]
nexus_harvest/db_extract.c: 157:7: WARN: dumping app_production.users — 14,827 rows [PII DATA]
nexus_harvest/db_extract.c: 162:7: WARN: dumping app_production.sessions — 89,341 rows [SESSION TOKENS]
nexus_harvest/db_extract.c: 167:7: WARN: dumping app_production.api_keys — 312 rows [API CREDENTIALS]
nexus_harvest/db_extract.c: 172:7: WARN: dumping app_production.payments — 7,203 rows [FINANCIAL DATA]
nexus_harvest/db_extract.c: 177:9: info: dump complete — 127MB uncompressed
nexus_harvest/db_extract.c: 182:9: info: ZSTD-19 compression: 127MB -> 14.7MB (ratio: 8.64x)
`,
`nexus_exfil/c2_tunnel.c: note: In function 'establish_c2_tunnel':
nexus_exfil/c2_tunnel.c: 203:3: info: TCP connect 10.31.7.12:4444 — OK
nexus_exfil/c2_tunnel.c: 208:3: info: TLS 1.3 handshake initiated
nexus_exfil/c2_tunnel.c: 213:5: info: server cert verified (pinned SHA3-256 fingerprint match)
nexus_exfil/c2_tunnel.c: 218:5: info: ECDH key exchange: CURVE25519 — shared secret derived
nexus_exfil/c2_tunnel.c: 223:5: info: session key: AES-256-GCM (96-bit nonce, 128-bit tag)
nexus_exfil/c2_tunnel.c: 228:5: info: HMAC-SHA3-256 auth challenge: PASSED
nexus_exfil/c2_tunnel.c: 233:5: info: C2 tunnel ACTIVE — operator: GHOST_7 [LVL 9]
nexus_exfil/c2_tunnel.c: 238:5: info: sending exfil manifest: 23 files, 14.9MB total
nexus_exfil/c2_tunnel.c: 243:7: info: xfer [  0%] initializing stream...
nexus_exfil/c2_tunnel.c: 248:7: info: xfer [ 10%]  1.49 MB / 14.90 MB  [bandwidth: 128 KB/s]
nexus_exfil/c2_tunnel.c: 253:7: info: xfer [ 20%]  2.98 MB / 14.90 MB  [ETA: 01:35]
nexus_exfil/c2_tunnel.c: 258:7: info: xfer [ 30%]  4.47 MB / 14.90 MB  [ETA: 01:18]
nexus_exfil/c2_tunnel.c: 263:7: info: xfer [ 40%]  5.96 MB / 14.90 MB  [ETA: 01:02]
nexus_exfil/c2_tunnel.c: 268:7: info: xfer [ 50%]  7.45 MB / 14.90 MB  [ETA: 00:46]
nexus_exfil/c2_tunnel.c: 273:7: info: xfer [ 60%]  8.94 MB / 14.90 MB  [ETA: 00:31]
nexus_exfil/c2_tunnel.c: 278:7: info: xfer [ 70%] 10.43 MB / 14.90 MB  [ETA: 00:18]
nexus_exfil/c2_tunnel.c: 283:7: info: xfer [ 80%] 11.92 MB / 14.90 MB  [ETA: 00:10]
nexus_exfil/c2_tunnel.c: 288:7: info: xfer [ 90%] 13.41 MB / 14.90 MB  [ETA: 00:04]
nexus_exfil/c2_tunnel.c: 293:7: info: xfer [100%] 14.90 MB / 14.90 MB  [COMPLETE]
nexus_exfil/c2_tunnel.c: 298:7: info: checksum verify: SHA3-256 match on all 23 files
nexus_exfil/c2_tunnel.c: 303:7: info: exfiltration SUCCESSFUL — data confirmed at C2
`,
`nexus_cleanup/ghost_erase.c: note: In function 'erase_all_traces':
nexus_cleanup/ghost_erase.c:  77:3: info: shred /root/.bash_history (7 passes)
nexus_cleanup/ghost_erase.c:  82:3: info: shred /home/ubuntu/.bash_history (7 passes)
nexus_cleanup/ghost_erase.c:  87:3: info: shred /home/admin/.bash_history (7 passes)
nexus_cleanup/ghost_erase.c:  92:3: info: patch /var/log/auth.log — removing 14 suspicious entries
nexus_cleanup/ghost_erase.c:  97:3: info: patch /var/log/syslog — removing timestamps 04:12-04:47 UTC
nexus_cleanup/ghost_erase.c: 102:3: info: patch /var/log/nginx/access.log — removing 7 entries (IP: 10.31.7.x)
nexus_cleanup/ghost_erase.c: 107:3: info: clear kernel audit log (/var/log/audit/audit.log)
nexus_cleanup/ghost_erase.c: 112:3: info: clear dmesg ring buffer (256 entries)
nexus_cleanup/ghost_erase.c: 117:3: info: remove /tmp/.nexus_* (11 temp files)
nexus_cleanup/ghost_erase.c: 122:3: info: remove /dev/shm/.ghost_* (4 shared mem segments)
nexus_cleanup/ghost_erase.c: 127:5: info: patch /var/log/wtmp — removing login entry (04:12:07 UTC)
nexus_cleanup/ghost_erase.c: 132:5: info: patch /var/log/lastlog — reset ubuntu last login
nexus_cleanup/ghost_erase.c: 137:5: info: clear utmp — removing active session entries
nexus_cleanup/ghost_erase.c: 142:5: info: all forensic traces removed
nexus_cleanup/ghost_erase.c: 147:7: note: rootkit ghost_v4.ko remains active in kernel
nexus_cleanup/ghost_erase.c: 152:7: note: backdoor listening on port 31337 (hidden from netstat)
nexus_cleanup/ghost_erase.c: 157:7: note: SSH key installed for re-entry: operator GHOST_7
nexus_cleanup/ghost_erase.c: 162:7: note: persistence: auto-reconnect to C2 on reboot via /etc/rc.local
`,
  ];

  let ut = 'nexus breach engine v4.2.1 — mission: SILENT_THUNDER_0x3F2A\n' +
    'target: 203.0.113.47 (CORP-NODE-DELTA)\n' +
    'operator: GHOST_7 [CLEARANCE LVL 9]\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  const targetLen = 45296;
  let phaseIdx = 0;
  let cycle = 0;

  while (ut.length < targetLen - 200) {
    const phase = phases[phaseIdx % phases.length];
    // On second+ cycle, bump line numbers to look like continued output
    if (cycle > 0) {
      const bump = cycle * 500;
      ut += phase.replace(/:(\s*)(\d+):(\d+):/g, (m, sp, ln, col) =>
        ':' + sp + (parseInt(ln) + bump) + ':' + col + ':');
    } else {
      ut += phase;
    }
    phaseIdx++;
    if (phaseIdx % phases.length === 0) cycle++;
  }

  ut += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'NEXUS BREACH ENGINE: ALL OBJECTIVES COMPLETE\n' +
    'MISSION STATUS: SUCCESS [UNDETECTED]\n' +
    'OPERATOR GHOST_7: DISCONNECTING\n';

  return ut;
}

const newUt = makeUtContent();

const contents = [newKt, newNt, newFt, newUnnamed1, newUnnamed2, newUnnamed3, newUt];

console.log('Content lengths:');
['kt', 'Nt', 'Ft', 'un1', 'un2', 'un3', 'Ut'].forEach((n, i) => {
  console.log(` ${n}: ${contents[i].length} chars`);
});

// ── Apply replacements in REVERSE ORDER (no position recalculation needed) ──
let result = src;
for (let i = POS.length - 1; i >= 0; i--) {
  const contentStart = POS[i] + 11;
  const end = getEnd(result, contentStart);
  const original = result.slice(contentStart, end);
  console.log(`\nReplacing [${i}] pos=${contentStart}..${end} (${original.length} chars) -> ${contents[i].length} chars`);
  result = result.slice(0, contentStart) + contents[i] + result.slice(end);
}

writeFileSync(filePath, result, 'utf8');
console.log('\nDone! New file length:', result.length, '(was:', src.length, ')');
