// Tiny stack VM: a faithful interpreter of make.fun's tiny stack ISA v1.
// Reads /input/<id>/{program,input}.bin, writes /output/<id>/{stdout.bin,exit.txt}.
// Opcode table T (base64): byte per opcode 0x00..0x53 = imm*16+pops*4+pushes+1, 0 = unknown.
import { mkdirSync as d, readdirSync as a, readFileSync as b, writeFileSync as c } from 'node:fs';
import { join as e } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input', O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const T = atob('ARJCBQcLDBAAAAAAAAAAAAoKCgoKCgoGCgoKBgoKCgAKCgoAAAAAAAAAAAAAAAAAISUlIQEAAAAAAAAAAAAAAAYJAAAAAAAAAAAAAAAAAAAFBQIF');
const B = [(x, y) => (x + y) | 0, (x, y) => (x - y) | 0, Math.imul, (x, y) => (x / y) | 0, (x, y) => (x % y) | 0, (x, y) => Math.floor((x >>> 0) / (y >>> 0)) | 0, (x, y) => ((x >>> 0) % (y >>> 0)) | 0, 0, (x, y) => x & y, (x, y) => x | y, (x, y) => x ^ y, 0, (x, y) => x << (y & 31), (x, y) => x >> (y & 31), (x, y) => (x >>> (y & 31)) | 0, 0, (x, y) => (x === y ? 1 : 0), (x, y) => (x < y ? 1 : 0), (x, y) => ((x >>> 0) < (y >>> 0) ? 1 : 0)];
function r(p, q) {
  const D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256), o = new Uint8Array(65536);
  let s = 0, g = 0, n = 0, t = 0, u = 0, f = 0;
  const E = (x) => ({ out: o.slice(0, f), code: x });
  for (;;) {
    if (t === 1e6) return E(10);
    if (n < 0 || n >= p.length) return E(9);
    const w = p[n];
    let v = T.charCodeAt(w);
    if (!v) return E(5);
    v--;
    const m = v >> 4, y = (v >> 2) & 3, z = v & 3;
    if (n + m >= p.length) return E(9);
    t++;
    const h = n + 1 + m;
    if (s < y) return E(2);
    if (s - y + z > 256) return E(3);
    n = h;
    if (w >= 16 && w <= 34 && w !== 23 && w !== 27) {
      if (w >= 19 && w <= 22 && !D[s - 1]) return E(4);
      const A = D[s - 2], G = D[s - 1];
      s -= 2; D[s++] = B[w - 16](A, G);
      continue;
    }
    switch (w) {
      case 0: return E(0);
      case 1: D[s++] = (p[h - 1] << 24) >> 24; break;
      case 2: D[s++] = p[h - 4] | (p[h - 3] << 8) | (p[h - 2] << 16) | (p[h - 1] << 24); break;
      case 3: s--; break;
      case 4: D[s] = D[s - 1]; s++; break;
      case 5: { const k = D[s - 1]; D[s - 1] = D[s - 2]; D[s - 2] = k; break; }
      case 6: D[s] = D[s - 2]; s++; break;
      case 7: { const k = D[s - 3]; D[s - 3] = D[s - 2]; D[s - 2] = D[s - 1]; D[s - 1] = k; break; }
      case 23: D[s - 1] = -D[s - 1] | 0; break;
      case 27: D[s - 1] = ~D[s - 1]; break;
      case 48: case 49: case 50: {
        const l = ((p[h - 2] | (p[h - 1] << 8)) << 16) >> 16;
        let k = true;
        if (w !== 48) { const v2 = D[--s]; k = w === 49 ? v2 === 0 : v2 !== 0; }
        if (k) n = h + l;
        break;
      }
      case 51:
        if (g === 64) return E(7);
        C[g++] = h; n = p[h - 2] | (p[h - 1] << 8); break;
      case 52:
        if (!g) return E(8);
        n = C[--g]; break;
      case 64: { const A = D[s - 1]; if (A < 0 || A > 255) return E(6); D[s - 1] = M[A]; break; }
      case 65: { const A = D[s - 1], G = D[s - 2]; if (A < 0 || A > 255) return E(6); s -= 2; M[A] = G; break; }
      case 80: { const x = String(D[s - 1]); if (f + x.length > 65536) return E(11); s--; for (let i = 0; i < x.length; i++) o[f++] = x.charCodeAt(i); break; }
      case 81:
        if (f + 1 > 65536) return E(11);
        o[f++] = D[--s] & 255; break;
      case 82: D[s++] = u < q.length ? q[u++] : -1; break;
      case 83: return E(D[--s] & 255);
    }
  }
}
for (const id of a(I).sort()) {
  const k = r(new Uint8Array(b(e(I, id, 'program.bin'))), new Uint8Array(b(e(I, id, 'input.bin'))));
  d(e(O, id), { recursive: true });
  c(e(O, id, 'stdout.bin'), k.out);
  c(e(O, id, 'exit.txt'), `${k.code}\n`);
}
