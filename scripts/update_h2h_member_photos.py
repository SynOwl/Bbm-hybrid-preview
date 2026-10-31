#!/usr/bin/env python3
"""Refresh Hearts2Hearts member portraits from the official Weverse highlight page."""
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import urllib.error
import urllib.request

SOURCE_URL = "https://weverse.io/hearts2hearts/highlight"
OUT = Path("data/h2h-members.json")
MEMBERS = {
    "jiwoo": r"\\bjiwoo\\b",
    "carmen": r"\\bcarmen\\b",
    "yuha": r"\\byuha\\b",
    "stella": r"\\bstella\\b",
    "juun": r"\\bjuun\\b",
    "ana": r"\\ba[-\\s]?na\\b",
    "ian": r"\\bian\\b",
    "yeon": r"\\bye[-\\s]?on\\b",
}


class WeverseImageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.anchor = None
        self.images = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a":
            self.anchor = {"href": attrs.get("href", ""), "labels": [], "urls": []}
            for key in ("aria-label", "title", "data-title"):
                if attrs.get(key):
                    self.anchor["labels"].append(attrs[key])
        elif tag == "img":
            labels = [attrs.get(k, "") for k in ("alt", "title", "aria-label")]
            urls = [attrs.get(k, "") for k in ("src", "data-src", "data-original")]
            srcset = attrs.get("srcset", "")
            if srcset:
                urls.append(srcset.split(",")[0].strip().split(" ")[0])
            if self.anchor is not None:
                self.anchor["labels"].extend(labels)
                self.anchor["urls"].extend(urls)
            else:
                self.images.append({"labels": labels, "urls": urls})

    def handle_data(self, data):
        if self.anchor is not None and data.strip():
            self.anchor["labels"].append(data.strip())

    def handle_endtag(self, tag):
        if tag == "a" and self.anchor is not None:
            self.anchor["urls"].append(self.anchor.get("href", ""))
            self.images.append(self.anchor)
            self.anchor = None


def normalize_url(value):
    value = (value or "").strip()
    if value.startswith("//"):
        value = "https:" + value
    if value.startswith("http://"):
        value = "https://" + value[len("http://"):]
    return value if value.startswith("https://") else ""


def fetch_page():
    request = urllib.request.Request(
        SOURCE_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; H2HProfileCatalog/1.0)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read().decode("utf-8", errors="replace")


def main():
    html = fetch_page()
    parser = WeverseImageParser()
    parser.feed(html)

    found = {}
    for item in parser.images:
        label = " ".join(x for x in item.get("labels", []) if x).casefold()
        if "most recent profile image" not in label:
            continue
        for member_id, pattern in MEMBERS.items():
            if member_id not in found and re.search(pattern, label, re.I):
                candidates = [normalize_url(x) for x in item.get("urls", [])]
                candidates = [x for x in candidates if "phinf.wevpstatic.net/" in x]
                if candidates:
                    found[member_id] = candidates[0]

    missing = sorted(set(MEMBERS) - set(found))
    if missing:
        raise RuntimeError(
            "Weverse did not expose all 8 latest profile portraits; "
            "keeping the previous catalog unchanged. Missing: " + ", ".join(missing)
        )

    existing = {"schemaVersion": 1, "members": []}
    if OUT.exists():
        try:
            existing = json.loads(OUT.read_text(encoding="utf-8"))
        except (OSError, ValueError, TypeError):
            pass
    old = {
        m.get("id"): m for m in existing.get("members", [])
        if isinstance(m, dict) and m.get("id")
    }
    members = []
    for member_id in MEMBERS:
        record = dict(old.get(member_id, {}))
        record["id"] = member_id
        record["name"] = record.get("name") or member_id.title()
        record["photoUrl"] = found[member_id]
        members.append(record)

    payload = {
        "schemaVersion": 1,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "Weverse official Hearts2Hearts community highlight — most recent member profile images",
        "sourceUrl": SOURCE_URL,
        "members": members,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")
    print("Updated official H2H member portraits: " + ", ".join(MEMBERS))


if __name__ == "__main__":
    main()
