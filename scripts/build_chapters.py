#!/usr/bin/env python3
"""Build the complete handbook chapter JSON bundle from the source DOCX files."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from docx import Document
from docx.document import Document as DocumentType
from docx.table import Table
from docx.text.paragraph import Paragraph

TITLES = {
    1: "Teknik Müdürlüğün Yapısı ve Organizasyonu",
    2: "Çalışma İlkeleri, Meslek Etiği ve Kurumsal Davranış",
    3: "İş Sağlığı ve Güvenliği",
    4: "Tiyatro Prodüksiyonunun Teknik Yönetim Süreci",
    5: "Sahne Birimleri ve Temsil İşletmesi",
    6: "Tasarım Birimleri",
    7: "Atölyeler, Üretim Birimleri ve Realizasyon Süreci",
    8: "Kostüm Üretim Birimleri, Gardırop, Peruka ve Makyaj",
    9: "Işık, Ses, Video ve Projeksiyon İşletme Birimleri",
    10: "Depo, Envanter, Arşiv ve Malzeme Yönetimi",
    11: "Turne, Lojistik, Yükleme ve Farklı Sahnelerde Teknik Kurulum",
    12: "Bakım, Onarım, Periyodik Kontroller ve Arıza Yönetimi",
    13: "Acil Durum, Yangın, Tahliye ve Temsilin Durdurulması",
    14: "Standart Operasyon Prosedürleri, Kontrol Listeleri ve Kurumsal Form Sistemi",
    15: "Teknik Çizim, Proje Teslimi, Dijital Dosya ve Arşiv Standartları",
    16: "Teknik Tiyatro Terimleri Sözlüğü, Kısaltmalar ve Uluslararası Meslek Karşılıkları",
    17: "Personel Yetkinlikleri, Eğitim, Oryantasyon ve Mesleki Gelişim Sistemi",
    18: "Teknik Denetim, İç Tetkik, Performans Ölçümü ve Sürekli İyileştirme Sistemi",
    19: "Sürdürülebilir Prodüksiyon, Enerji, Atık ve Karbon Yönetimi",
    20: "Bütçe, Maliyet, Satın Alma ve Teknik Kaynak Planlaması",
    21: "Tesis, Sahne Binası ve Mekân İşletme Yönetimi",
    22: "Erişilebilirlik, Kapsayıcı Teknik Üretim ve Eşit Katılım",
    23: "Hukuki Uygunluk, Sözleşmeler, Fikrî Haklar, Veri ve Medya Yönetimi",
    24: "El Kitabının Kurumsal Uygulanması, Ana Matrisler ve Sürekli Yaşatılması",
}


def iter_blocks(parent: DocumentType):
    for child in parent.element.body.iterchildren():
        if child.tag.endswith("}p"):
            yield Paragraph(child, parent)
        elif child.tag.endswith("}tbl"):
            yield Table(child, parent)


def clean(value: str) -> str:
    return re.sub(r"[ \t]+", " ", value.replace("\u00ad", "").replace("\r", "\n")).strip()


def chapter_number(path: Path) -> int:
    match = re.match(r"Bolum_(\d+)_", path.name)
    if not match:
        raise ValueError(f"Bölüm numarası bulunamadı: {path.name}")
    return int(match.group(1))


def title_from_cover(text: str, number: int) -> str:
    lines = [clean(line) for line in text.splitlines() if clean(line)]
    lines = [line for line in lines if not re.fullmatch(rf"BÖLÜM\s+{number}", line, re.I)]
    return " ".join(lines).title()


def table_block(table: Table) -> dict:
    rows = []
    for row in table.rows:
        values = [clean(cell.text) for cell in row.cells]
        if any(values):
            rows.append(values)
    if not rows:
        return {"type": "table", "headers": [], "rows": []}
    width = max(len(row) for row in rows)
    rows = [row + [""] * (width - len(row)) for row in rows]
    return {"type": "table", "headers": rows[0], "rows": rows[1:]}


def build_chapter(path: Path) -> dict:
    number = chapter_number(path)
    document = Document(path)
    paragraphs = [p for p in document.paragraphs if clean(p.text)]
    cover_title = next((p for p in paragraphs if p.style.name == "Title"), None)
    if not cover_title:
        marker_index = next(
            (i for i, p in enumerate(paragraphs) if re.fullmatch(rf"BÖLÜM\s+{number}", clean(p.text), re.I)),
            None,
        )
        cover_title = paragraphs[marker_index + 1] if marker_index is not None and marker_index + 1 < len(paragraphs) else None
    title = TITLES[number]

    cover_index = paragraphs.index(cover_title) if cover_title else 0
    subtitle = ""
    for paragraph in paragraphs[cover_index + 1 :]:
        text = clean(paragraph.text)
        if paragraph.style.name.startswith("Heading"):
            break
        if text and not re.search(r"^(Sürüm|TİYATRO TEKNİK)", text, re.I):
            subtitle = text
            break

    sections = []
    current = {
        "title": "Bölüm Hakkında",
        "level": 1,
        "paragraphs": [],
        "bullets": [],
        "tables": [],
        "blocks": [],
    }
    started = False

    def finish_section():
        nonlocal current
        if current["blocks"]:
            sections.append(current)

    for block in iter_blocks(document):
        if isinstance(block, Paragraph):
            text = clean(block.text)
            if not text:
                continue
            style = block.style.name
            if block is cover_title or (cover_title and text == clean(cover_title.text)):
                started = True
                continue
            if not started:
                continue
            if style.startswith("Heading"):
                finish_section()
                level_match = re.search(r"(\d+)", style)
                current = {
                    "title": text,
                    "level": int(level_match.group(1)) if level_match else 2,
                    "paragraphs": [],
                    "bullets": [],
                    "tables": [],
                    "blocks": [],
                }
                continue
            if style.startswith("List"):
                current["bullets"].append(text)
                current["blocks"].append({"type": "bullet", "text": text})
            else:
                current["paragraphs"].append(text)
                current["blocks"].append({"type": "paragraph", "text": text})
        elif isinstance(block, Table) and started:
            table = table_block(block)
            if table["headers"] or table["rows"]:
                current["tables"].append(table)
                current["blocks"].append(table)

    finish_section()
    word_count = sum(
        len(re.findall(r"\b[\wÇĞİÖŞÜçğıöşü]+\b", block.get("text", "")))
        + sum(len(re.findall(r"\b[\wÇĞİÖŞÜçğıöşü]+\b", cell)) for row in block.get("rows", []) for cell in row)
        + sum(len(re.findall(r"\b[\wÇĞİÖŞÜçğıöşü]+\b", cell)) for cell in block.get("headers", []))
        for section in sections
        for block in section["blocks"]
    )
    return {
        "number": number,
        "title": title,
        "subtitle": subtitle,
        "sectionCount": len(sections),
        "wordCount": word_count,
        "sections": sections,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)

    paths = {}
    for path in args.source.glob("Bolum_*.docx"):
        number = chapter_number(path)
        if number == 1 and "Gelistirilmis" not in path.name:
            continue
        paths[number] = path
    if set(paths) != set(range(1, 25)):
        raise SystemExit(f"Eksik bölümler: {sorted(set(range(1, 25)) - set(paths))}")

    chapters = [build_chapter(paths[number]) for number in range(1, 25)]
    index = [
        {
            "number": chapter["number"],
            "title": chapter["title"],
            "subtitle": chapter["subtitle"],
            "sectionCount": chapter["sectionCount"],
            "wordCount": chapter["wordCount"],
        }
        for chapter in chapters
    ]
    (args.output / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    for chapter in chapters:
        (args.output / f"{chapter['number']:02}.json").write_text(
            json.dumps(chapter, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )
    print(
        f"{len(chapters)} bölüm, {sum(c['sectionCount'] for c in chapters)} başlık, "
        f"{sum(c['wordCount'] for c in chapters):,} kelime"
    )


if __name__ == "__main__":
    main()
