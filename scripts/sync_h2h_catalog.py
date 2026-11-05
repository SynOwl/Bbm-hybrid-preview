#!/usr/bin/env python3
import json, subprocess, sys
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

def normalize(raw, short):
    vid, title = raw.get('id'), raw.get('title')
    ts = raw.get('release_timestamp') or raw.get('timestamp')
    if not vid or not title or not ts:
        return None
    if raw.get('channel_id') and raw['channel_id'] != CHANNEL_ID:
        return None
    try:
        published = datetime.fromtimestamp(float(ts), UTC)
    except (TypeError, ValueError, OverflowError):
        return None
    return {'id': str(vid), 'title': str(title), 'title_id': str(title),
            'kind': 'short' if short else 'video', 'isShort': short,
            'published': stamp(published),
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
        archive['videos'], archive['shorts'], archive['updatedAt'] = all_v, all_s, stamp(now)
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
        monthly_data = {'schemaVersion': 3, 'windowDays': 31, 'updatedAt': stamp(now),
            'source': {'youtube': CHANNEL},
            'collectionPolicy': 'Official Hearts2Hearts uploads from today and previous 30 days (31 calendar dates), including videos and Shorts. Older entries expire automatically.',
            'videos': monthly}
        MONTHLY.write_text(json.dumps(monthly_data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        status = {'schemaVersion': 1, 'status': 'updated' if added_v or added_s else 'no_changes',
            'message': 'Katalog GitHub diperbarui dari kanal YouTube resmi.' if added_v or added_s else 'Pemeriksaan berhasil; belum ada upload baru.',
            'checkedAt': stamp(started), 'completedAt': stamp(now), 'catalogUpdatedAt': stamp(now),
            'newVideos': len(added_v), 'newShorts': len(added_s), 'newVideoIds': added_v, 'newShortIds': added_s,
            'archiveVideos': len(all_v), 'archiveShorts': len(all_s), 'monthlyItems': len(monthly), 'channelId': CHANNEL_ID}
        STATUS.write_text(json.dumps(status, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(status, ensure_ascii=False))
        return 0
    except Exception as exc:
        now = datetime.now(UTC)
        status = {'schemaVersion': 1, 'status': 'failed',
            'message': 'Sinkronisasi gagal: ' + str(exc)[:250], 'checkedAt': stamp(started),
            'completedAt': stamp(now), 'catalogUpdatedAt': previous.get('catalogUpdatedAt'),
            'newVideos': 0, 'newShorts': 0, 'channelId': CHANNEL_ID}
        STATUS.write_text(json.dumps(status, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(status, ensure_ascii=False), file=sys.stderr)
        return 1

if __name__ == '__main__':
    raise SystemExit(main())