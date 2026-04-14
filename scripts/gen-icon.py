#!/usr/bin/env python3
"""
Generate a 512x512 pixel-art checkpoint booth icon for CHECKPOINT.
No external dependencies — pure Python stdlib.
"""

import os, struct, zlib

# ── palette ────────────────────────────────────────────────────────────────
BG      = (10,  12,  15)   # near-black background
WALL    = (42,  52,  72)   # booth wall (dark navy)
WALL2   = (30,  38,  55)   # booth shadow
ROOF    = (28,  34,  50)   # roof
ROOF_D  = (18,  22,  36)   # roof dark edge
WINDOW  = (140, 200, 220)  # glass tint
WIN_GL  = (200, 235, 245)  # glass highlight
DESK    = (90,  70,  40)   # wooden desk / counter
DESK_D  = (60,  45,  25)   # desk shadow
LAMP    = (255, 230, 100)  # lamp glow yellow
LAMP_B  = (180, 155,  50)  # lamp base
RED     = (180,  30,  30)  # barrier stripe
STRIPE  = (240, 200,  20)  # barrier yellow stripe
GUARD   = (50,  65,  90)   # guard silhouette
GUARD_H = (30,  40,  60)   # guard hat / dark
SKIN    = (200, 155, 110)  # face skin
FLAG_R  = (180,  30,  30)  # flag red
FLAG_W  = (230, 230, 230)  # flag white
GROUND  = (22,  26,  32)   # ground

def pack_png(width, height, rows_rgba):
    """Minimal pure-Python PNG encoder (RGBA, 8-bit)."""
    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = b''
    for row in rows_rgba:
        raw += b'\x00'  # filter byte
        for r, g, b, a in row:
            raw += bytes([r, g, b, a])
    compressed = zlib.compress(raw, 9)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    idat = chunk(b'IDAT', compressed)
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

# ── canvas ──────────────────────────────────────────────────────────────────
S = 512
# grid unit
U = S // 32  # 16 px per unit

def make_canvas(color=BG):
    r, g, b = color
    return [[(r, g, b, 255)] * S for _ in range(S)]

def rect(canvas, x, y, w, h, color, alpha=255):
    r, g, b = color
    for row in range(max(0, y), min(S, y + h)):
        for col in range(max(0, x), min(S, x + w)):
            canvas[row][col] = (r, g, b, alpha)

def hline(canvas, x, y, w, color):
    rect(canvas, x, y, w, 1, color)

def vline(canvas, x, y, h, color):
    rect(canvas, x, y, 1, h, color)

canvas = make_canvas(BG)

# ── ground strip ────────────────────────────────────────────────────────────
rect(canvas, 0, S - 3*U, S, 3*U, GROUND)

# ── booth body ──────────────────────────────────────────────────────────────
bx, by = 8*U, 8*U          # booth top-left
bw, bh = 16*U, 17*U        # booth width, height

rect(canvas, bx, by, bw, bh, WALL)
rect(canvas, bx, by, 2,  bh, WALL2)          # left shadow
rect(canvas, bx + bw - 2, by, 2, bh, WALL2) # right shadow

# ── roof ────────────────────────────────────────────────────────────────────
rx, ry = bx - U, by - 2*U
rw, rh = bw + 2*U, 2*U + 2
rect(canvas, rx, ry, rw, rh, ROOF)
rect(canvas, rx, ry + rh - 2, rw, 2, ROOF_D)   # roof bottom edge

# small overhang shadow under roof
rect(canvas, bx, by, bw, 4, WALL2)

# ── window ──────────────────────────────────────────────────────────────────
wx, wy = bx + 2*U, by + 2*U
ww, wh = bw - 4*U, 6*U
rect(canvas, wx, wy, ww, wh, WINDOW)
# window frame (dark border)
for t in range(2):
    hline(canvas, wx, wy + t, ww, WALL2)
    hline(canvas, wx, wy + wh - 1 - t, ww, WALL2)
    vline(canvas, wx + t, wy, wh, WALL2)
    vline(canvas, wx + ww - 1 - t, wy, wh, WALL2)
# glass highlight diagonal
for i in range(min(ww // 3, wh // 3)):
    if 0 <= wy + i < S and 0 <= wx + i < S:
        canvas[wy + i][wx + i] = (*WIN_GL, 255)
    if 0 <= wy + i < S and 0 <= wx + i + 1 < S:
        canvas[wy + i][wx + i + 1] = (*WIN_GL, 200)

# ── guard silhouette (visible through window) ───────────────────────────────
gx = wx + ww // 2 - 2*U
gy = wy + U // 2
# hat
rect(canvas, gx + U//2, gy, U, U//2, GUARD_H)
rect(canvas, gx, gy + U//2, 2*U, U//4, GUARD_H)
# head
rect(canvas, gx + U//4, gy + U//2, 3*U//2, U + U//4, SKIN)
# guard body (just visible at window bottom)
rect(canvas, gx, gy + U//2 + U + U//4, 2*U, wh - (gy - wy) - U//2 - U - U//4 - 2, GUARD)

# ── lamp on roof ────────────────────────────────────────────────────────────
lx = bx + bw // 2 - U // 2
ly = ry - U
rect(canvas, lx, ly, U, U, LAMP_B)
rect(canvas, lx - U//2, ly - U//2, 2*U, U//2, LAMP)
# glow halo (faint)
for dr in range(1, 3):
    for dx in range(-dr * 2, dr * 2 + 1):
        for dy2 in range(-dr, dr + 1):
            nx, ny2 = lx + U//2 + dx, ly - U//2 + dy2
            if 0 <= nx < S and 0 <= ny2 < S:
                cur = canvas[ny2][nx]
                blended = (
                    min(255, cur[0] + 20 // dr),
                    min(255, cur[1] + 18 // dr),
                    min(255, cur[2] + 5 // dr),
                    255
                )
                canvas[ny2][nx] = blended

# ── desk / counter ──────────────────────────────────────────────────────────
dx2 = bx
dy2 = by + 8*U
dw2 = bw
dh2 = 3*U
rect(canvas, dx2, dy2, dw2, dh2, DESK)
rect(canvas, dx2, dy2, dw2, 3, DESK_D)      # top edge
rect(canvas, dx2, dy2 + dh2 - 3, dw2, 3, DESK_D)

# small slot / document tray on desk
slot_x = dx2 + 2*U
slot_y = dy2 + U//2
slot_w = dw2 - 4*U
slot_h = U
rect(canvas, slot_x, slot_y, slot_w, slot_h, DESK_D)
# document peek (white paper in slot)
rect(canvas, slot_x + 2, slot_y + 2, slot_w - 4, slot_h - 4, (230, 225, 210, 255)[:3])

# ── barrier / boom gate ──────────────────────────────────────────────────────
# left post
rect(canvas, bx - 3*U, S - 3*U - 4*U, U//2, 4*U, WALL2)
# horizontal arm (raised 45° — just show it flat for icon clarity)
arm_y = S - 3*U - 4*U
arm_x = bx - 3*U + U//2
arm_w = 5*U
arm_h = U//2
# striped arm
for i in range(arm_w // U):
    col = RED if i % 2 == 0 else STRIPE
    rect(canvas, arm_x + i * U, arm_y, min(U, arm_w - i * U), arm_h, col)

# right post + arm (mirrored)
rpost_x = bx + bw + 2*U + U//2
rect(canvas, rpost_x, S - 3*U - 4*U, U//2, 4*U, WALL2)
for i in range(5):
    col = STRIPE if i % 2 == 0 else RED
    px = rpost_x - U * (i + 1)
    rect(canvas, px, arm_y, min(U, rpost_x - px), arm_h, col)

# ── flag on roof ─────────────────────────────────────────────────────────────
pole_x = bx + bw - U
pole_y = ry - 4*U
rect(canvas, pole_x, pole_y, 2, 4*U, WALL2)
# simple two-color flag (red over white = Arstotzka-ish)
rect(canvas, pole_x + 2, pole_y, 3*U, U, FLAG_R)
rect(canvas, pole_x + 2, pole_y + U, 3*U, U, FLAG_W)

# ── "CHECKPOINT" text pixels (tiny baked pixel font, 5-high) ─────────────
# skip — small text wouldn't read at icon size; the booth shape is enough

# ── output ──────────────────────────────────────────────────────────────────
out_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'icon.png')
out_path = os.path.normpath(out_path)
png_data = pack_png(S, S, canvas)
with open(out_path, 'wb') as f:
    f.write(png_data)
print(f"Wrote {S}x{S} icon → {out_path}  ({len(png_data):,} bytes)")
