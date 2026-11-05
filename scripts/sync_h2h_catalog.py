#!/usr/bin/env python3
import json, subprocess, sys
import urllib.request
import re
from pathlib import Path
from datetime import datetime, timedelta, timezone

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / 'data/h2h-archive.json'
MONTHLY = ROOT / 'data/h2h-monthly.json'
STATUS = ROOT / 'data/h2h-sync-status.json'
CHANNEL = 'https://www.youtube.com/@hearts2hearts.official'
CHANNEL_ID = 'UC7Q3HUnJA3nvjZR2JeMn2Cw'
UTC = timezone.utc

def stamp(dt):
    return dt.astimezone(UTC).replace(microsecond=0).isoformat().replace('+00:00', 'Z')

def scrape(tab):
    cmd = ['yt-dlp', '--flat-playlist', '--dump-single-json', '--no-warnings', '--skip-download', CHANNEL + '/' + tab]
    p = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=240)
    data = json.loads(p.stdout)
    channel_id = data.get('channel_id') or data.get('id')
    if channel_id and channel_id != CHANNEL_ID:
        raise RuntimeError('ID kanal tidak cocok: ' + str(channel_id))
    entries = data.get('entries')
    if not isinstance(entries, list) or not entries:
        raise RuntimeError('Daftar YouTube ' + tab + ' kosong/tidak valid')
    return entries

def discover_recent_channel_ids():
    # Secondary discovery source: public channel page maintained from public
    # YouTube channel data. IDs are never trusted on their own; each is checked
    # against the official channel ID by yt-dlp before entering the catalog.
    url = 'https://topcreadores.com/canal/' + CHANNEL_ID
    request = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (compatible; BBMxH2H-Catalog/1.0)'}
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        page = response.read().decode('utf-8', errors='replace')
    ids = re.findall(
        r'(?:youtube\\.com/(?:watch\\?v=|shorts/)|youtu\\.be/)([A-Za-z0-9_-]{11})',
        page
    )
    return list(dict.fromkeys(ids))


def extract_video(video_id):
    url = 'https://www.youtube.com/watch?v=' + video_id
    cmd = ['yt-dlp', '--dump-single-json', '--no-warnings', '--skip-download', url]
    result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=120)
    return json.loads(result.stdout)


def normalize(raw, short):
    vid, title = raw.get('id'), raw.get('title')
    if not vid or not title:
        return None
    if raw.get('channel_id') and raw['channel_id'] != CHANNEL_ID:
        return None

    # yt-dlp's flat Shorts playlist can omit timestamp/release_timestamp for
    # newly published entries while still providing upload_date. Do not drop
    # those uploads: use the exact timestamp when present, otherwise preserve
    # the published calendar date at a neutral UTC midday.
    ts = raw.get('release_timestamp')
    if ts is None:
        ts = raw.get('timestamp')
    published = None
    if ts is not None:
        try:
            published = datetime.fromtimestamp(float(ts), UTC)
        except (TypeError, ValueError, OverflowError, OSError):
            published = None

    if published is None:
        date_value = raw.get('release_date') or raw.get('upload_date')
        if date_value:
            date_text = str(date_value).strip()
            for date_format in ('%Y%m%d', '%Y-%m-%d'):
                try:
                    published = datetime.strptime(date_text[:10], date_format).replace(
                        hour=12, minute=0, second=0, tzinfo=UTC
                    )
                    break
                except ValueError:
                    continue
    if published is None:
        return None

    return {'id': str(vid), 'title': str(title), 'title_id': str(title),
            'kind': 'short' if short else 'video', 'isShort': short,
            'published': stamp(published),
            'publishedDateOnly': not (raw.get('release_timestamp') is not None or raw.get('timestamp') is not None),
            'url': 'https://www.youtube.com/watch?v=' + str(vid),
            'thumbnail': 'https://img.youtube.com/vi/' + str(vid) + '/hqdefault.jpg',
            'source': 'youtube-official'}

def main():
    started = datetime.now(UTC)
    previous = {}
    if STATUS.exists():
        previous = json.loads(STATUS.read_text(encoding='utf-8'))
    try:
        archive = json.loads(ARCHIVE.read_text(encoding='utf-8'))
        if archive.get('channel', {}).get('id') != CHANNEL_ID:
            raise RuntimeError('Arsip bukan kanal Hearts2Hearts resmi')
        if not isinstance(archive.get('videos'), list) or not isinstance(archive.get('shorts'), list):
            raise RuntimeError('Struktur arsip tidak valid')
        raw_videos, raw_shorts = scrape('videos'), scrape('shorts')
        videos = {x['id']: x for x in archive['videos'] if isinstance(x, dict) and x.get('id')}
        shorts = {x['id']: x for x in archive['shorts'] if isinstance(x, dict) and x.get('id')}
        added_v, added_s = [], []

        # Secondary discovery catches recent channel uploads missing from
        # the YouTube tab extractors. Every candidate is re-fetched from
        # YouTube and must match the official channel ID before being stored.
        try:
            discovered_ids = discover_recent_channel_ids()
            discovered_added = 0
            for video_id in discovered_ids:
                if video_id in videos or video_id in shorts:
                    continue
                try:
                    metadata = extract_video(video_id)
                    if metadata.get('channel_id') != CHANNEL_ID:
                        print('Discovery candidate rejected (channel mismatch): ' + video_id, file=sys.stderr)
                        continue
                    duration = metadata.get('duration')
                    if duration is None:
                        print('Discovery candidate skipped (duration unavailable): ' + video_id, file=sys.stderr)
                        continue
                    is_short = float(duration) <= 180
                    item = normalize(metadata, is_short)
                    if not item:
                        continue
                    target, added = (shorts, added_s) if is_short else (videos, added_v)
                    target[video_id] = item
                    added.append(video_id)
                    discovered_added += 1
                    print('Channel-page fallback added ' + ('Short' if is_short else 'video') + ': ' + item['title'])
                except Exception as discovery_error:
                    print('Channel-page fallback could not inspect ' + video_id + ': ' + str(discovery_error)[:180], file=sys.stderr)
            print('Channel-page fallback checked ' + str(len(discovered_ids)) + ' IDs; added ' + str(discovered_added))
        except Exception as discovery_error:
            # Primary yt-dlp tab collection remains usable if the secondary
            # public discovery page is temporarily unavailable.
            print('Channel-page fallback unavailable: ' + str(discovery_error)[:220], file=sys.stderr)

        for raw, is_short, target, added in ([(x, False, videos, added_v) for x in raw_videos] + [(x, True, shorts, added_s) for x in raw_shorts]):
            item = normalize(raw, is_short)
            if not item:
                continue
            old = target.get(item['id'])
            if old:
                item['title_id'] = old.get('title_id') or item['title_id']
                item['thumbnail'] = old.get('thumbnail') or item['thumbnail']
            else:
                added.append(item['id'])
            target[item['id']] = item
        now = datetime.now(UTC)
        all_v = sorted(videos.values(), key=lambda x: x.get('published', ''), reverse=True)
        all_s = sorted(shorts.values(), key=lambda x: x.get('published', ''), reverse=True)
        has_new_uploads = bool(added_v or added_s)
        archive['videos'], archive['shorts'] = all_v, all_s
        if has_new_uploads:
            archive['updatedAt'] = stamp(now)
        ARCHIVE.write_text(json.dumps(archive, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        cutoff = now - timedelta(days=30)
        monthly = []
        for x in all_v + all_s:
            try:
                published = datetime.fromisoformat(x['published'].replace('Z', '+00:00'))
            except (KeyError, TypeError, ValueError):
                continue
            if cutoff <= published <= now + timedelta(minutes=5):
                monthly.append({'id': x['id'], 'title': x.get('title', ''),
                    'title_id': x.get('title_id') or x.get('title', ''), 'type': 'youtube',
                    'kind': 'short' if x.get('isShort') else 'video', 'isShort': bool(x.get('isShort')),
                    'published': x['published'], 'url': x.get('url'), 'thumbnail': x.get('thumbnail'),
                    'source': 'youtube-official'})
        monthly.sort(key=lambda x: x['published'], reverse=True)
        monthly_data = {'schemaVersion': 3, 'windowDays': 31, 'updatedAt': archive.get('updatedAt', stamp(now)),
            'source': {'youtube': CHANNEL},
            'collectionPolicy': 'Official Hearts2Hearts uploads from today and previous 30 days (31 calendar dates), including videos and Shorts. Older entries expire automatically.',
            'videos': monthly}
        MONTHLY.write_text(json.dumps(monthly_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        new_uploads = bool(added_v or added_s)
        next_state = 'updated' if new_uploads else 'no_changes'
        if not new_uploads and previous.get('status') == 'no_changes':
            # Do not create a Git commit every 10 minutes when the catalog is unchanged.
            status = previous
        else:
            status = {'schemaVersion': 1, 'status': next_state,
                'message': 'Katalog GitHub diperbarui dari kanal YouTube resmi.' if new_uploads else 'Pemeriksaan berhasil; belum ada upload baru.',
                'checkedAt': stamp(started), 'completedAt': stamp(now), 'catalogUpdatedAt': archive.get('updatedAt'),
                'newVideos': len(added_v), 'newShorts': len(added_s), 'newVideoIds': added_v, 'newShortIds': added_s,
                'archiveVideos': len(all_v), 'archiveShorts': len(all_s), 'monthlyItems': len(monthly), 'channelId': CHANNEL_ID}
        STATUS.write_text(json.dumps(status, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(status, ensure_ascii=False))
        return 0
    except Exception as exc:
        now = datetime.now(UTC)
        if previous.get('status') == 'failed':
            status = previous
        else:
            status = {'schemaVersion': 1, 'status': 'failed',
                'message': 'Sinkronisasi gagal: ' + str(exc)[:250], 'checkedAt': stamp(started),
                'completedAt': stamp(now), 'catalogUpdatedAt': previous.get('catalogUpdatedAt'),
                'newVideos': 0, 'newShorts': 0, 'channelId': CHANNEL_ID}
        STATUS.write_text(json.dumps(status, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(status, ensure_ascii=False), file=sys.stderr)
        return 1

if __name__ == '__main__':
    raise SystemExit(main())