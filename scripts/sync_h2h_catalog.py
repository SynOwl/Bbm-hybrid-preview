#!/usr/bin/env python3
import json, os, subprocess, sys, urllib.parse, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime, timedelta, timezone

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / 'data/h2h-archive.json'
MONTHLY = ROOT / 'data/h2h-monthly.json'
STATUS = ROOT / 'data/h2h-sync-status.json'
CHANNEL = 'https://www.youtube.com/@hearts2hearts.official'
CHANNEL_ID = 'UC7Q3HUnJA3nvjZR2JeMn2Cw'
SHORTS_PLAYLIST_ID = 'UUSH' + CHANNEL_ID[2:]
UTC = timezone.utc
YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY', '').strip()
YOUTUBE_API = 'https://www.googleapis.com/youtube/v3'

def api_get(endpoint, params):
    query = dict(params)
    query['key'] = YOUTUBE_API_KEY
    url = YOUTUBE_API + '/' + endpoint + '?' + urllib.parse.urlencode(query)
    try:
        with urllib.request.urlopen(url, timeout=35) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        raise RuntimeError('YouTube Data API ' + endpoint + ' returned HTTP ' + str(exc.code)) from None
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        raise RuntimeError('YouTube Data API ' + endpoint + ' request failed: ' + type(exc).__name__) from None

def api_uploads_playlist():
    data = api_get('channels', {'part': 'snippet,contentDetails', 'id': CHANNEL_ID})
    items = data.get('items') or []
    if len(items) != 1 or items[0].get('id') != CHANNEL_ID:
        raise RuntimeError('YouTube Data API tidak mengonfirmasi channel ID resmi')
    playlist_id = items[0].get('contentDetails', {}).get('relatedPlaylists', {}).get('uploads')
    if not playlist_id:
        raise RuntimeError('Uploads playlist resmi tidak ditemukan')
    return playlist_id

def api_playlist_entries(playlist_id, max_pages=4):
    video_ids, page_token = [], None
    for _ in range(max_pages):
        params = {'part': 'snippet,contentDetails', 'playlistId': playlist_id, 'maxResults': 50}
        if page_token:
            params['pageToken'] = page_token
        data = api_get('playlistItems', params)
        for entry in data.get('items') or []:
            snippet = entry.get('snippet') or {}
            video_id = (entry.get('contentDetails') or {}).get('videoId') or (snippet.get('resourceId') or {}).get('videoId')
            if video_id and snippet.get('channelId') in (None, CHANNEL_ID):
                video_ids.append(str(video_id))
        page_token = data.get('nextPageToken')
        if not page_token:
            break
    video_ids = list(dict.fromkeys(video_ids))
    result = []
    for offset in range(0, len(video_ids), 50):
        batch = video_ids[offset:offset + 50]
        details = api_get('videos', {'part': 'snippet,contentDetails', 'id': ','.join(batch)})
        for video in details.get('items') or []:
            snippet = video.get('snippet') or {}
            if video.get('id') and snippet.get('channelId') == CHANNEL_ID:
                published_at = snippet.get('publishedAt')
                timestamp = None
                if published_at:
                    try:
                        timestamp = datetime.fromisoformat(published_at.replace('Z', '+00:00')).timestamp()
                    except (TypeError, ValueError):
                        timestamp = None
                result.append({'id': video['id'], 'title': snippet.get('title'),
                    'channel_id': snippet.get('channelId'), 'timestamp': timestamp,
                    'release_timestamp': timestamp})
    return result


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

def scrape_shorts_playlist():
    # YouTube's generated Shorts-only playlist is a second official discovery
    # path. Its ID is UUSH + the channel ID without the leading "UC".
    url = 'https://www.youtube.com/playlist?list=' + SHORTS_PLAYLIST_ID
    cmd = ['yt-dlp', '--flat-playlist', '--dump-single-json', '--no-warnings', '--skip-download', url]
    result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=240)
    data = json.loads(result.stdout)
    entries = data.get('entries')
    if not isinstance(entries, list) or not entries:
        raise RuntimeError('Daftar playlist Shorts resmi kosong/tidak valid')
    if data.get('id') and data['id'] != SHORTS_PLAYLIST_ID:
        raise RuntimeError('ID playlist Shorts tidak cocok')
    return [x for x in entries if not x.get('channel_id') or x.get('channel_id') == CHANNEL_ID]


def extract_video(video_id, is_short=False):
    # Use the Shorts URL form for Shorts; some entries in the generated UUSH
    # playlist do not resolve correctly through the watch?v= URL form.
    url = ('https://www.youtube.com/shorts/' if is_short else 'https://www.youtube.com/watch?v=') + video_id
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
        api_status = 'not_configured'
        collection_source = 'yt-dlp'
        if YOUTUBE_API_KEY:
            api_status = 'configured'
            try:
                uploads_playlist = api_uploads_playlist()
                raw_videos = api_playlist_entries(uploads_playlist, max_pages=3)
                if not raw_videos:
                    raise RuntimeError('Uploads playlist API kosong/tidak valid')
                collection_source = 'YouTube Data API v3'
                api_status = 'videos_ok'
                print('Videos source: YouTube Data API v3; verified channel ' + CHANNEL_ID)
            except Exception as api_error:
                print('YouTube Data API videos unavailable; using yt-dlp fallback: ' + str(api_error)[:220], file=sys.stderr)
                raw_videos = scrape('videos')
                api_status = 'failed_fallback'
            try:
                raw_shorts = api_playlist_entries(SHORTS_PLAYLIST_ID, max_pages=5)
                if not raw_shorts:
                    raise RuntimeError('Playlist Shorts resmi tidak tersedia melalui API')
                print('Shorts source: official UUSH playlist via YouTube Data API v3')
                api_status = 'videos_and_shorts_ok' if api_status == 'videos_ok' else api_status
            except Exception as api_error:
                print('YouTube Data API Shorts playlist unavailable; using verified yt-dlp discovery fallback: ' + str(api_error)[:220], file=sys.stderr)
                raw_shorts = scrape('shorts')
                api_status = 'shorts_fallback' if api_status == 'videos_ok' else api_status
        else:
            raw_videos, raw_shorts = scrape('videos'), scrape('shorts')
        videos = {x['id']: x for x in archive['videos'] if isinstance(x, dict) and x.get('id')}
        shorts = {x['id']: x for x in archive['shorts'] if isinstance(x, dict) and x.get('id')}
        added_v, added_s = [], []

        # Merge the channel Shorts tab with YouTube's generated Shorts-only
        # playlist. The playlist often exposes the newest Shorts before the
        # channel tab extractor catches up; IDs are deduplicated below.
        if not (YOUTUBE_API_KEY and api_status == 'videos_and_shorts_ok'):
            try:
                playlist_shorts = scrape_shorts_playlist()
                by_id = {x.get('id'): x for x in raw_shorts if x.get('id')}
                for entry in playlist_shorts:
                    if entry.get('id'):
                        by_id[entry['id']] = entry
                raw_shorts = list(by_id.values())
                print('Shorts sources: channel tab + official UUSH playlist; merged ' + str(len(raw_shorts)) + ' unique entries')
            except Exception as playlist_error:
                print('Official UUSH Shorts playlist unavailable; keeping channel tab results: ' + str(playlist_error)[:220], file=sys.stderr)

        new_short_candidates = [
            {'id': x.get('id'), 'title': x.get('title'), 'timestamp': x.get('timestamp'),
             'release_timestamp': x.get('release_timestamp'), 'upload_date': x.get('upload_date')}
            for x in raw_shorts if x.get('id') and x.get('id') not in shorts
        ]
        print('New Shorts candidates before normalization: ' + json.dumps(new_short_candidates, ensure_ascii=False))

        for raw, is_short, target, added in ([(x, False, videos, added_v) for x in raw_videos] + [(x, True, shorts, added_s) for x in raw_shorts]):
            item = normalize(raw, is_short)
            if not item and raw.get('id') and raw['id'] not in target:
                # New flat-playlist entries sometimes omit all date fields.
                # Enrich only new candidates with full official YouTube metadata.
                try:
                    metadata = extract_video(str(raw['id']), is_short)
                    merged = dict(metadata)
                    for key, value in raw.items():
                        if value not in (None, ''):
                            merged[key] = value
                    if merged.get('channel_id') and merged['channel_id'] != CHANNEL_ID:
                        print('Skipping candidate from another channel: ' + str(raw['id']), file=sys.stderr)
                        continue
                    item = normalize(merged, is_short)
                    if item:
                        print('Enriched new ' + ('Short' if is_short else 'video') + ' metadata: ' + item['title'])
                except Exception as metadata_error:
                    detail = getattr(metadata_error, 'stderr', None) or str(metadata_error)
                    print('Could not enrich new candidate ' + str(raw['id']) + ': ' + str(detail)[:500], file=sys.stderr)
            if not item:
                print('Skipping invalid catalog entry: ' + str(raw.get('id')) + ' | ' + str(raw.get('title')) +
                      ' | timestamp=' + str(raw.get('timestamp')) + ' | upload_date=' + str(raw.get('upload_date')),
                      file=sys.stderr)
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
                'archiveVideos': len(all_v), 'archiveShorts': len(all_s), 'monthlyItems': len(monthly), 'channelId': CHANNEL_ID, 'apiKeyConfigured': bool(YOUTUBE_API_KEY), 'apiStatus': api_status, 'collectionSource': collection_source}
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
                'newVideos': 0, 'newShorts': 0, 'channelId': CHANNEL_ID, 'apiKeyConfigured': bool(YOUTUBE_API_KEY), 'apiStatus': 'failed'}
        STATUS.write_text(json.dumps(status, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(status, ensure_ascii=False), file=sys.stderr)
        return 1

if __name__ == '__main__':
    raise SystemExit(main())