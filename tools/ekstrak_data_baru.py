"""Ekstrak dua berkas PLN yang diterima 24 Nov 2026 ke data.js.

  * LAGAM BEBAN OKTOBER 2026 SEBA,RAIJUA,SEMAU.xlsx
      logsheet per unit per jam, 31 hari, untuk PLTD Seba (Sabu), Raijua, Semau
  * NERACA DAYA SEPTEMBER 2026.xlsx
      lembar "LF ROTE": beban sistem Rote per jam, 30 hari
      lembar "ND BAA":  neraca daya harian sistem Rote (PLTD Ba'a + PLTD sewa BGP)

Menambah kunci `lg` (langgam bulanan penuh) dan `neraca` ke window.DATA tanpa
mengubah kunci lama (mesin, ndao, raijua).

Jalankan dari root repo:  python3 tools/ekstrak_data_baru.py
"""
import json
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
LAGAM = ROOT / "data" / "Langgam-Beban-Okt-2026-Seba-Raijua-Semau.xlsx"
NERACA = ROOT / "data" / "Neraca-Daya-Rote-Sep-2026.xlsx"
DATAJS = ROOT / "data.js"


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def iv(v):
    """angka bulat bila bulat, supaya data.js tetap ringkas"""
    v = round(float(v), 1)
    return int(v) if v == int(v) else v


# nama rapi + kelompok tiap blok unit (urutan blok di lembar sumber).
# g: pln = PLTD milik PLN, sewa = diesel sewa, pv = PLTS
UNIT = {
    "RAIJUA": [
        ("Deutz TD226B-4", "pln"),
        ("Deutz BF6M1013E (…386)", "pln"),
        ("Deutz BF6M1013E (…036)", "pln"),
        ("Volvo TAD1630GE", "pln"),
        ("Deutz BF10L513", "pln"),
        ("Deutz TCD2013L064V", "pln"),
        ("MAN D2866LE201", "pln"),
        ("Deutz BF6M1013EC", "pln"),  # di lembar tertulis "PLTS", tetapi mesinnya Deutz diesel
        ("PLTS + baterai (SMA STP 25000TL-30)", "pv"),
    ],
    "SEBA": [
        ("MTU 12V2000G62 (…049)", "pln"),
        ("MTU 12V2000G62 (…047)", "pln"),
        ("Cummins QSK23-G3", "pln"),
        ("MTU 12V2000G62 (…556)", "pln"),
        ("MTU 12V2000G65 (…926)", "pln"),
        ("MTU 12V2000G65 mobile", "pln"),
        ("Cummins KTA-50-G8", "pln"),
        ("MTU 18V2000G62", "pln"),
        ("Volvo TAD733GE", "pln"),
        ("Perkins P110D5", "pln"),
        ("Komatsu SAA6D140", "pln"),
        ("MAN D2842LE201", "pln"),
        (None, None),  # blok 13 kosong
        ("Diesel sewa SPI (hybrid Eilode)", "sewa"),
        ("PLTS sewa SPI (hybrid Eilode)", "pv"),
    ],
    "SEMAU": [
        ("Volvo TAD1630GE", "pln"),
        ("Deutz TCD2013L064V", "pln"),
        ("MTU 12V2000G62 (…048)", "pln"),
        ("MTU 12V2000G62 (…044)", "pln"),
        ("MTU 12V2000G65", "pln"),
        ("PLTS on-grid", "pv"),
    ],
}
SHEET_KEY = {"SEBA": "sabu", "RAIJUA": "raijua", "SEMAU": "semau"}


def read_lagam():
    wb = openpyxl.load_workbook(LAGAM, data_only=True)
    out, notes = {}, []
    for title, key in SHEET_KEY.items():
        ws = wb[title]
        blocks, r = [], 1
        while r <= ws.max_row:
            if ws.cell(r, 2).value == "PEMBANGKIT":
                jr = r
                while ws.cell(jr, 2).value != "JAM":
                    jr += 1
                blocks.append(dict(
                    raw=str(ws.cell(r + 1, 4).value or ""),
                    grid=[[num(ws.cell(jr + 1 + h, 4 + d).value) for d in range(31)] for h in range(24)],
                    dt=num(ws.cell(jr + 25, 4).value),
                    dmn=num(ws.cell(jr + 26, 4).value),
                    dmp=num(ws.cell(jr + 27, 4).value),
                ))
                r = jr + 30
            else:
                r += 1
        assert len(blocks) == len(UNIT[title]), (title, len(blocks))
        units = []
        for b, (name, g) in zip(blocks, UNIT[title]):
            if name is None:
                continue
            e = sum(map(sum, b["grid"]))
            units.append(dict(n=name, g=g, dt=iv(b["dt"]), dmn=iv(b["dmn"]), dmp=iv(b["dmp"]),
                              grid=[[iv(v) for v in row] for row in b["grid"]] if e > 0 else None))
        # total sistem = jumlah semua unit. Rekap di lembar sumber identik kecuali 1 sel Semau.
        tot = [[sum(b["grid"][h][d] for b in blocks) for d in range(31)] for h in range(24)]
        rc = next(c for c in range(30, 75) for rr in range(1, 8) if ws.cell(rr, c).value == "REKAP BEBAN")
        d1 = next(c for c in range(rc - 2, rc + 3) if ws.cell(7, c).value == 1)
        for h in range(24):
            for d in range(31):
                rv = num(ws.cell(8 + h, d1 + d).value)
                if abs(rv - tot[h][d]) > 0.5:
                    notes.append(f"{title} tgl {d+1} jam {h+1:02d}.00: rekap {rv:g} kW, jumlah unit {tot[h][d]:g} kW")
        out[key] = dict(label="Oktober 2026", bulan="Okt", ndays=31,
                        src="Langgam beban Oktober 2026, lembar " + title,
                        tot=[[iv(v) for v in row] for row in tot], units=units)
    return out, notes


def read_neraca():
    wb = openpyxl.load_workbook(NERACA, data_only=True)
    ws = wb["LF ROTE"]
    assert ws["B6"].value == "JAM" and ws["B7"].value == "01.00"
    tot = [[iv(num(ws.cell(7 + h, 4 + d).value)) for d in range(30)] for h in range(24)]
    lg = dict(label="September 2026", bulan="Sep", ndays=30,
              src="Neraca daya September 2026, lembar LF ROTE", tot=tot, units=None)

    nd = wb["ND BAA"]
    assert "NERACA DAYA" in str(nd["D3"].value)
    row = lambda r: [iv(num(nd.cell(r, 8 + d).value)) for d in range(30)]
    units = []
    for r in (11, 12, 15):
        units.append(dict(lok="PLTD Ba'a (PLN)" if r < 15 else "PLTD sewa Bima Golden Powerindo (BGP)",
                          merk=str(nd.cell(r, 3).value).strip() if r < 15 else "BGP (sewa)",
                          type=str(nd.cell(r, 4).value or "").strip(),
                          seri=str(nd.cell(r, 5).value or "").strip(),
                          th=nd.cell(r, 6).value, kva=num(nd.cell(r, 7).value), dm=num(nd.cell(r, 8).value)))
    ner = dict(bulan="September 2026", units=units, dm=num(nd["H19"].value),
               bpMalam=row(20), bpSiang=row(21), cadOp=row(22), terbesar=num(nd["H24"].value),
               cadPasti=row(26), status=str(nd["H27"].value), manajer=str(nd["C36"].value).strip())
    return lg, ner


def main():
    js = DATAJS.read_text(encoding="utf-8")
    m = re.match(r"window\.DATA=(.*);?\s*$", js, re.S)
    data = json.loads(m.group(1).rstrip().rstrip(";"))
    lg, notes = read_lagam()
    lg_rote, ner = read_neraca()
    lg = {"rote": lg_rote, **lg}
    data["lg"] = lg
    data["neraca"] = {"rote": ner}
    DATAJS.write_text("window.DATA=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print("data.js diperbarui:", ", ".join(f"{k} ({v['label']})" for k, v in lg.items()))
    for n in notes:
        print("  selisih rekap:", n)


if __name__ == "__main__":
    main()
