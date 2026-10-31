#!/usr/bin/env python3
"""Refresh the rolling 31-calendar-day Hearts2Hearts YouTube catalog."""
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

CHANNEL_ID = "UC7Q3HUnJA3nvjZR2JeMn2Cw"
FEEDS = [
    ("uploads", f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"),
    # YouTube's automatic long-form and Shorts playlists. If unavailable,
    # the main channel feed remains a working fallback.
    ("video", f"https://www.youtube.com/feeds/videos.xml?playlist_id=UULF{CHANNEL_ID[2:]}"),
    ("short", f"https://www.youtube.com/feeds/videos.xml?playlist_id=UUSH{CHANNEL_ID[2:]}"),
]
OUT = Path("data/h2h-monthly.json")
NS = {"atom": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}


def fetch_feed(url):
    req = urllib.request.Request(url, headers={"User-Agent": "BBM-H2H-Rolling-Catalog/2.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        root = ET.fromstring(response.read())
    entries = []
    for entry in root.findall("atom:entry", NS):
        title = (entry.findtext("atom:title", default="", namespaces=NS) or "").strip()
        video_id = (entry.findtext("yt:videoId", default="", namespaces=NS) or "").strip()
        published_raw = (entry.findtext("atom:published", default="", namespaces=NS) or "").strip()
        if not video_id or not title or not published_raw:
            continue
        try:
            published = datetime.fromisoformat(published_raw.replace("Z", "+00:00")).astimezone(timezone.utc)
        except ValueError:
            continue
        entries.append((video_id, title, published))
    return entries



def translate_title_to_indonesian(title):
    """Best-effort title translation; return empty string when the service is unavailable."""
    import urllib.parse
    query = urllib.parse.urlencode({
        "client": "gtx", "sl": "auto", "tl": "id", "dt": "t", "q": title
    })
    url = "https://translate.googleapis.com/translate_a/single?" + query
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
        translated = "".join(
            part[0] for part in (payload[0] or [])
            if isinstance(part, list) and part and isinstance(part[0], str)
        ).strip()
        return translated if translated and translated.casefold() != title.casefold() else ""
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, TypeError, IndexError) as exc:
        print(f"Translation unavailable for title: {exc}")
        return ""


def main():
    now = datetime.now(timezone.utc)
    cutoff_date = now.date() - timedelta(days=30)  # today + previous 30 calendar days
    videos_by_id = {}
    successful_feeds = 0

    # Preserve already collected entries (including user-supplied links), but
    # expire anything older than the rolling 31-calendar-day window.
    if OUT.exists():
        try:
            previous = json.loads(OUT.read_text(encoding="utf-8"))
            for item in previous.get("videos", []):
                if not isinstance(item, dict) or not item.get("id") or not item.get("published"):
                    continue
                try:
                    published = datetime.fromisoformat(item["published"].replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    continue
                if published.date() >= cutoff_date:
                    videos_by_id[item["id"]] = item
        except (OSError, ValueError, TypeError):
            pass

    for feed_kind, url in FEEDS:
        try:
            entries = fetch_feed(url)
            successful_feeds += 1
        except (urllib.error.URLError, TimeoutError, ET.ParseError, OSError) as exc:
            print(f"Feed {feed_kind} unavailable: {exc}")
            continue

        for video_id, title, published in entries:
            if published.date() < cutoff_date:
                continue
            is_short = feed_kind == "short"
            old_item = videos_by_id.get(video_id, {})
            translated_title = old_item.get("title_id", "")
            if old_item.get("title") != title or not translated_title:
                translated_title = translate_title_to_indonesian(title)
            item = {
                "id": video_id,
                "title": title,
                "title_id": translated_title,
                "type": "mv" if "mv" in title.lower() else "youtube",
                "kind": "short" if is_short else ("video" if feed_kind == "video" else "upload"),
                "isShort": is_short,
                "published": published.isoformat(),
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                "source": "youtube-official"
            }
            videos_by_id[video_id] = item

    if successful_feeds == 0 and not videos_by_id:
        raise RuntimeError("All YouTube feeds failed and no saved catalog is available.")

    videos = list(videos_by_id.values())
    videos.sort(key=lambda item: item.get("published", ""), reverse=True)
    payload = {
        "schemaVersion": 3,
        "windowDays": 31,
        "updatedAt": now.isoformat(),
        "source": {"youtube": "https://www.youtube.com/@hearts2hearts.official"},
        "collectionPolicy": "Official Hearts2Hearts uploads from today and the previous 30 calendar days (31 calendar dates), including videos and Shorts. Older entries expire automatically.",
        "videos": videos
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(videos)} item(s) from the rolling 31-calendar-day window.")


if __name__ == "__main__":
    main()
