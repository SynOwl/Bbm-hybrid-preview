#!/usr/bin/env python3
"""Build a permanent, paginated Hearts2Hearts YouTube archive."""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request

CHANNEL_ID = "UC7Q3HUnJA3nvjZR2JeMn2Cw"
UPLOADS_PLAYLIST_ID = "UU" + CHANNEL_ID[2:]
SHORTS_PLAYLIST_ID = "UUSH" + CHANNEL_ID[2:]
OUT = Path("data/h2h-archive.json")
API_BASE = "https://www.googleapis.com/youtube/v3"


def api_get(resource, params):
    query = urllib.parse.urlencode(params)
    url = f"{API_BASE}/{resource}?{query}"
    req = urllib.request.Request(url, headers={"User-Agent": "BBM-H2H-Archive/4.0"})
    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1200]
        raise RuntimeError(f"YouTube API {resource} failed ({exc.code}): {detail}") from exc


def fetch_playlist(playlist_id, api_key):
    """Read every playlist page; never silently accept a partial archive."""
    items = []
    page_token = None
    page = 0
    while True:
        params = {
            "part": "snippet,contentDetails",
            "playlistId": playlist_id,
            "maxResults": 50,
            "key": api_key,
        }
        if page_token:
            params["pageToken"] = page_token
        payload = api_get("playlistItems", params)
        page_items = payload.get("items", [])
        for entry in page_items:
            snippet = entry.get("snippet", {})
            video_id = (snippet.get("resourceId") or {}).get("videoId")
            title = (snippet.get("title") or "").strip()
            published = snippet.get("publishedAt") or snippet.get("publishedAt")
            if video_id and title and published and video_id != "0":
                items.append({
                    "id": video_id,
                    "title": title,
                    "published": published,
                })
        page += 1
        print(f"Playlist {playlist_id}: page {page}, {len(items)} item(s)")
        page_token = payload.get("nextPageToken")
        if not page_token:
            break
    return items


def translate_title_to_indonesian(title):
    """Best-effort free translation; preserve original title on failure."""
    query = urllib.parse.urlencode({
        "client": "gtx", "sl": "auto", "tl": "id", "dt": "t", "q": title
    })
    req = urllib.request.Request(
        "https://translate.googleapis.com/translate_a/single?" + query,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
        translated = "".join(
            part[0] for part in (payload[0] or [])
            if isinstance(part, list) and part and isinstance(part[0], str)
        ).strip()
        return translated if translated and translated.casefold() != title.casefold() else ""
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, TypeError, IndexError) as exc:
        print(f"Translation unavailable: {exc}")
        return ""


def main():
    api_key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("Set the YOUTUBE_API_KEY GitHub Actions secret before building the full archive.")

    previous = {"videos": [], "shorts": []}
    if OUT.exists():
        try:
            previous = json.loads(OUT.read_text(encoding="utf-8"))
        except (OSError, ValueError, TypeError):
            print("Previous archive unreadable; rebuilding from YouTube.")

    old_by_id = {}
    for group in ("videos", "shorts"):
        for item in previous.get(group, []):
            if isinstance(item, dict) and item.get("id"):
                old_by_id[item["id"]] = item

    # The uploads playlist is the source of all channel uploads.
    uploads = fetch_playlist(UPLOADS_PLAYLIST_ID, api_key)
    # The channel's automatic Shorts playlist provides reliable category membership.
    shorts_raw = fetch_playlist(SHORTS_PLAYLIST_ID, api_key)
    short_ids = {item["id"] for item in shorts_raw}

    def build_item(raw, is_short):
        video_id = raw["id"]
        title = raw["title"]
        old = old_by_id.get(video_id, {})
        title_id = old.get("title_id", "")
        if old.get("title") != title or not title_id:
            title_id = translate_title_to_indonesian(title)
        return {
            "id": video_id,
            "title": title,
            "title_id": title_id,
            "kind": "short" if is_short else "video",
            "isShort": is_short,
            "published": raw["published"],
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
            "source": "youtube-official",
        }

    videos = []
    shorts = []
    seen = set()
    for raw in uploads:
        if raw["id"] in seen:
            continue
        seen.add(raw["id"])
        if raw["id"] in short_ids:
            shorts.append(build_item(raw, True))
        else:
            videos.append(build_item(raw, False))

    # Shorts missing from the uploads response are still retained from the Shorts playlist.
    upload_ids = {item["id"] for item in uploads}
    for raw in shorts_raw:
        if raw["id"] not in upload_ids and raw["id"] not in seen:
            shorts.append(build_item(raw, True))
            seen.add(raw["id"])

    def newest_first(items):
        return sorted(items, key=lambda x: x.get("published", ""), reverse=True)

    videos = newest_first(videos)
    shorts = newest_first(shorts)
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "schemaVersion": 4,
        "updatedAt": now,
        "channel": {
            "name": "Hearts2Hearts",
            "id": CHANNEL_ID,
            "url": "https://www.youtube.com/@hearts2hearts.official",
        },
        "collectionPolicy": "Permanent archive of public official channel uploads, separated into videos and Shorts. The archive is rebuilt using complete paginated playlist reads.",
        "videos": videos,
        "shorts": shorts,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Archive complete: {len(videos)} video(s), {len(shorts)} Short(s).")


if __name__ == "__main__":
    main()
