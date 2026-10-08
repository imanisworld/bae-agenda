"""Static, escaped, offline review document. No JavaScript or remote assets."""

import html
from collections import defaultdict


def render(manifest):
    def esc(value):
        return html.escape(str(value), quote=True)

    groups = defaultdict(list)
    events = {e["id"]: e for e in manifest["events"]}
    for item in manifest["files"]:
        groups[item["match"]["event_id"]].append(item)
    parts = [
        '<!doctype html><html lang="en"><meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; '
        "img-src 'self' data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'\">",
        "<title>Media Curator · Local review</title><style>",
        "body{background:#11141c;color:#eef0f7;font:16px system-ui;margin:2rem auto;padding:0 1rem;"
        "max-width:1200px}h1,h2{color:#f8d68c}article{border:1px solid #465065;padding:1rem;"
        "border-radius:12px;overflow-wrap:anywhere}section{display:grid;gap:1rem;"
        "grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))}"
        "img{width:100%;height:auto}small{color:#bac3d6}li{margin:.4rem 0}summary{cursor:pointer}"
        "</style><h1>Media Curator</h1><p>Local review only · originals retained · "
        "recommendations require human review.</p>",
        f"<p>{len(manifest['files'])} files · {len(manifest['ignored'])} ignored · "
        "No vision/content judgments. Scene signals are sparse sampled comparisons.</p>",
    ]
    for group in sorted(groups, key=lambda k: (k is None, str(k))):
        event = events.get(group)
        title = f"{event['title']} — {event['event_date']}" if event else "UNMATCHED"
        parts.append(f"<h2>{esc(title)}</h2><section>")
        for item in groups[group]:
            match = item["match"]
            parts.append(
                f"<article><h3>{esc(item['filename'])}</h3><p><b>{esc(item['status'])}</b> · "
                f"{esc(match['confidence'])} · score {match['score']}</p>"
            )
            preview = item.get("contact_sheet") or next(iter(item.get("previews", [])), None)
            if preview:
                parts.append(
                    f'<img loading="lazy" src="{esc(preview)}" alt="Review preview of '
                    f'{esc(item["filename"])}">'
                )
            parts.append(
                f"<small>{esc(item['relative_path'])}</small><p>Capture: "
                f"{esc(item['capture_time'] or 'unknown')} · "
                f"{esc(item['timestamp_source'] or 'no embedded timestamp')}</p>"
            )
            parts.append(
                f"<p>Technical quality: {esc(item.get('technical', {}).get('overall', 'unavailable'))}"
                " / 100</p><ul>"
            )
            for reason in match["reasons"] + item["selection_reasons"] + item["warnings"]:
                parts.append(f"<li>{esc(reason)}</li>")
            for key in ("exact_duplicate_of", "near_duplicate_of"):
                if item.get(key):
                    parts.append(f"<li>{esc(key)}: {esc(item[key])}</li>")
            parts.append("</ul>")
            for segment in item.get("highlights", []):
                parts.append(f"<p><b>{esc(segment['range'])}</b> — {esc(segment['reason'])}</p>")
            if match.get("alternatives"):
                parts.append("<details><summary>Alternative event matches</summary><ul>")
                for alternative in match["alternatives"]:
                    parts.append(
                        f"<li>{esc(events[alternative['event_id']]['title'])}: "
                        f"{alternative['score']} — {esc('; '.join(alternative['reasons']))}</li>"
                    )
                parts.append("</ul></details>")
            parts.append("</article>")
        parts.append("</section>")
    if manifest["ignored"]:
        parts.append("<details><summary>Ignored files</summary><ul>")
        parts.extend(f"<li>{esc(i['path'])}: {esc(i['reason'])}</li>" for i in manifest["ignored"])
        parts.append("</ul></details>")
    parts.append("</html>")
    return "".join(parts)
