#!/usr/bin/env python3
"""Replace bibliography/regulation sections with official DT-only sources."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


DT_SOURCES = [
    {
        "title": "5441 Sayılı Devlet Tiyatroları Personeli Hakkında Kanun",
        "url": "https://teftis.ktb.gov.tr/TR-14212/5441-sayili-devlet-tiyatrolari-personeli-hakkinda-kanun.html",
        "note": "Devlet Tiyatrolarının kurumsal ve personel dayanağı.",
    },
    {
        "title": "Devlet Tiyatroları Görev ve Çalışma Yönergesi",
        "url": "https://teftis.ktb.gov.tr/TR-264533/devlet-tiyatrolari-gorev-ve-calisma-yonergesi.html",
        "note": "Birimlerin ve sanat-teknik görevlerin yetki ve sorumlulukları.",
    },
    {
        "title": "Devlet Tiyatroları Genel Müdürlüğü İş Sağlığı ve Güvenliği Yönergesi",
        "url": "https://teftis.ktb.gov.tr/TR-436464/devlet-tiyatrolari-genel-mudurlugu-is-sagligi-ve-guvenligi-yonergesi.html",
        "note": "Devlet Tiyatroları içindeki iş sağlığı ve güvenliği uygulamaları.",
    },
    {
        "title": "Devlet Tiyatroları Genel Müdürlüğü Fikri Hak Alımları Yönergesi",
        "url": "https://teftis.ktb.gov.tr/TR-264280/devlet-tiyatrolari-genel-mudurlugu-fikri-hak-alimlari-yonergesi.html",
        "note": "Devlet Tiyatrolarının fikrî hak alım süreçleri.",
    },
    {
        "title": "Devlet Tiyatroları Genel Müdürlüğü Salon ve Sahne Tahsis Yönergesi",
        "url": "https://teftis.ktb.gov.tr/TR-264282/devlet-tiyatrolari-genel-mudurlugu-salon-ve-sahne-tahsis-yonergesi.html",
        "note": "Devlet Tiyatroları salon ve sahnelerinin tahsis esasları.",
    },
    {
        "title": "Devlet Tiyatroları Genel Müdürlüğü Ön Mali Kontrol İşlemleri Yönergesi",
        "url": "https://teftis.ktb.gov.tr/TR-264284/devlet-tiyatrolari-genel-mudurlugu-on-mali-kontrol-islemleri-yonergesi.html",
        "note": "Devlet Tiyatrolarına özgü ön mali kontrol işlemleri.",
    },
    {
        "title": "Devlet Tiyatroları Genel Müdürlüğü İç Denetim Yönergesi",
        "url": "https://teftis.ktb.gov.tr/TR-264283/devlet-tiyatrolari-genel-mudurlugu-ic-denetim-yonergesi.html",
        "note": "Devlet Tiyatroları iç denetim faaliyetlerinin çerçevesi.",
    },
    {
        "title": "Devlet Tiyatroları Genel Müdürlüğü Saymanlığı ile Ayniyat Saymanlığı Hesap Usulleri Hakkında Yönetmelik",
        "url": "https://teftis.ktb.gov.tr/TR-263917/devlet-tiyatrolari-genel-mudurlugu-saymanligi-ile-ayniyat-saymanligi-hesap-usulleri-hakkinda-yonetmelik.html",
        "note": "Devlet Tiyatrolarının muhasebe ve ayniyat işlemleri.",
    },
]


SOURCE_HEADING = re.compile(
    r"(kaynakça|kaynaklar\s+ve|kaynak\s+notları|kaynak\s+hiyerarşisi|"
    r"kaynak\s+çerçevesi|hukuki\s+ve\s+mesleki\s+kaynak|"
    r"resm[iî]\s+dayanak|kurumsal\s+ve\s+(?:hukuki|uluslararası)\s+dayanak|"
    r"mevzuat|koruma\s+ve\s+sürdürülebilirlik\s+referansları|"
    r"uluslararası\s+geliştirme\s+kaynakları|referans\s+çerçevesi)",
    re.IGNORECASE,
)


def replace_section(section: dict) -> None:
    section["title"] = "Resmî Devlet Tiyatroları Kaynakları"
    section["paragraphs"] = [
        "Bu bölümde yalnız Devlet Tiyatrolarına doğrudan ilişkin resmî kaynaklar tutulur. "
        "Kaynağın güncel metnini açmak için bağlantıya basın."
    ]
    section["bullets"] = []
    section["tables"] = []
    section["blocks"] = [
        {"type": "paragraph", "text": section["paragraphs"][0]},
        *({"type": "source", **source} for source in DT_SOURCES),
    ]


def word_count(sections: list[dict]) -> int:
    total = 0
    for section in sections:
        for block in section.get("blocks", []):
            values = []
            if block.get("type") in {"paragraph", "bullet"}:
                values.append(block.get("text", ""))
            elif block.get("type") == "table":
                values.extend(block.get("headers", []))
                values.extend(cell for row in block.get("rows", []) for cell in row)
            elif block.get("type") == "source":
                values.extend([block.get("title", ""), block.get("note", "")])
            total += sum(
                len(re.findall(r"\b[\wÇĞİÖŞÜçğıöşü]+\b", value, re.UNICODE))
                for value in values
            )
    return total


def process(directory: Path) -> tuple[int, int]:
    chapter_count = section_count = 0
    index_path = directory / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    index_by_number = {item["number"]: item for item in index}
    for path in sorted(directory.glob("[0-9][0-9].json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        changed = 0
        for section in data.get("sections", []):
            if SOURCE_HEADING.search(section.get("title", "")):
                replace_section(section)
                changed += 1
        data["wordCount"] = word_count(data["sections"])
        data["sectionCount"] = len(data["sections"])
        summary = index_by_number[data["number"]]
        summary["wordCount"] = data["wordCount"]
        summary["sectionCount"] = data["sectionCount"]
        if changed:
            chapter_count += 1
            section_count += changed
        path.write_text(
            json.dumps(data, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
    index_path.write_text(
        json.dumps(index, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    return chapter_count, section_count


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("chapters", type=Path)
    args = parser.parse_args()
    chapters, sections = process(args.chapters)
    print(f"{chapters} bölümde {sections} kaynak/mevzuat başlığı DT kaynaklarıyla değiştirildi.")


if __name__ == "__main__":
    main()
