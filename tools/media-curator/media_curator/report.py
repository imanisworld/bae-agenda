"""Escaped offline snapshots and server-rendered local review forms; no JavaScript."""

import html
from collections import defaultdict

from .analysis import clock
from .reviews import STATUSES


def esc(value):
    return html.escape(str(value), quote=True)


def options(values, selected):
    return "".join(
        f'<option value="{esc(value)}"{(" selected" if value == selected else "")}>{esc(label)}</option>'
        for value, label in values
    )


def controls(item, events, token):
    human = item.get("human_review") or {}
    effective = item.get("effective_event_id")
    event_options = [(e["id"], f"{e['title']} · {e['event_date']}") for e in events]
    if effective and effective not in {value for value, _ in event_options}:
        event_options.append((effective, f"Saved event absent from catalog: {effective}"))
    approved = human.get("approved")
    approval_value = "pending" if approved is None else "yes" if approved else "no"
    parts = [
        '<form method="post" action="/decision">',
        f'<input type="hidden" name="token" value="{esc(token)}">',
        f'<input type="hidden" name="item_id" value="{esc(item["id"])}">',
        f'<input type="hidden" name="revision" value="{human.get("revision", 0)}">',
        '<fieldset><legend>Event assignment</legend><label>Event<select name="event_id">',
        options([("", "Choose an event")] + event_options, effective or ""),
        "</select></label>",
        '<button name="action" value="confirm_event">Confirm suggested event</button>',
        '<button name="action" value="change_event">Change event</button>',
        '<button name="action" value="unmatched">Mark unmatched</button>',
        '<button name="action" value="reject_event">Reject suggested event</button>',
        '<button name="action" value="auto_event">Clear event corrections</button></fieldset>',
        '<label>Selection status<select name="status">',
        options(
            [("", "AUTO — follow recommendation")] + [(s, s.replace("_", " ").title()) for s in STATUSES],
            human.get("status") or "",
        ),
        "</select></label>",
        '<label>Approval<select name="approved">',
        options([("pending", "Pending"), ("yes", "Approved"), ("no", "Rejected")], approval_value),
        "</select></label>",
        f'<label>Notes<textarea name="note" maxlength="10000" rows="3">{esc(human.get("note", ""))}</textarea></label>',
    ]
    if item["media_type"] == "video":
        parts.append("<fieldset><legend>Highlight decisions</legend>")
        for index, segment in enumerate(item.get("effective_highlights", item.get("highlights", []))):
            value = "pending" if segment.get("approved") is None else "yes" if segment["approved"] else "no"
            parts.append(
                f"<label>{clock(segment['start_seconds'])}–{clock(segment['end_seconds'])}"
                f'<select name="range_{index}">'
            )
            parts.append(
                options([("pending", "Pending"), ("yes", "Approve range"), ("no", "Reject range")], value)
            )
            parts.append("</select></label>")
        parts.extend(
            [
                "<p>Add a manual range (seconds; saved as approved):</p>",
                '<label>Start<input type="number" name="range_start" min="0" step="0.001"></label>',
                '<label>End<input type="number" name="range_end" min="0" step="0.001"></label></fieldset>',
            ]
        )
    parts.extend(
        [
            '<button name="action" value="save">Save review</button>',
            '<button name="action" value="approve">Approve</button>',
            '<button name="action" value="reject">Reject</button>',
            "<p><small>Saved locally for this content hash, including identical copies. "
            "Approval never uploads, edits, or publishes media.</small></p></form>",
        ]
    )
    return "".join(parts)


def render(manifest, token=None, message=""):
    groups = defaultdict(list)
    events = {e["id"]: e for e in manifest["events"]}
    for item in manifest["files"]:
        groups[item.get("effective_event_id", item["match"]["event_id"])].append(item)
    form_policy = "'self'" if token else "'none'"
    parts = [
        '<!doctype html><html lang="en"><head><meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; '
        f"img-src 'self' data:; style-src 'unsafe-inline'; base-uri 'none'; form-action {form_policy}\">",
        "<title>Media Curator · Local review</title><style>",
        "body{background:#11141c;color:#eef0f7;font:16px system-ui;margin:2rem auto;padding:0 1rem;"
        "max-width:1200px}h1,h2{color:#f8d68c}article{border:1px solid #465065;padding:1rem;"
        "border-radius:12px;overflow-wrap:anywhere;min-width:0}section{display:grid;gap:1rem;"
        "grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))}"
        "img{width:100%;height:auto}small{color:#bac3d6}li{margin:.4rem 0}summary{cursor:pointer}"
        "form{border-top:1px solid #465065;margin-top:1rem;padding-top:1rem}"
        "label{display:block;margin:.8rem 0}input,select,textarea{display:block;box-sizing:border-box;"
        "width:100%;padding:.6rem;background:#1e2635;color:#eef0f7;border:1px solid #8792a8;"
        "border-radius:4px;font:inherit}button{padding:.55rem;margin:.25rem;background:#f8d68c;"
        "color:#11141c;border:0;border-radius:4px;cursor:pointer}fieldset{border:1px solid #465065;min-width:0}button{max-width:100%}"
        ":focus-visible{outline:3px solid #80baff;outline-offset:3px}"
        "</style></head><body><h1>Media Curator</h1><p>Local review only · originals retained · "
        "approval does not publish.</p>",
        f"<p>{len(manifest['files'])} files · {len(manifest['ignored'])} ignored. "
        "No vision/content judgments. Scene signals are sparse sampled comparisons.</p>",
    ]
    if not token:
        parts.append(
            "<p>This is a scan-time snapshot. Run <code>media-curator review manifest.json</code> "
            "to edit durable local decisions.</p>"
        )
    if message:
        parts.append(f'<p role="status">{esc(message)}</p>')
    for group in sorted(groups, key=lambda k: (k is None, str(k))):
        event = events.get(group)
        title = (
            f"{event['title']} — {event['event_date']}"
            if event
            else (f"Saved event: {group}" if group else "UNMATCHED")
        )
        parts.append(f"<h2>{esc(title)}</h2><section>")
        for item in groups[group]:
            match = item.get("auto_match", item["match"])
            human = item.get("human_review") or {}
            approval = item.get("effective_approved")
            approval_label = "PENDING" if approval is None else "APPROVED" if approval else "REJECTED"
            auto_title = events.get(match["event_id"], {}).get("title", match["event_id"] or "UNMATCHED")
            parts.append(
                f'<article id="item-{esc(item["id"])}"><h3>{esc(item["filename"])}</h3><p>'
                f"<b>{esc(item.get('effective_status', item['status']))}</b> · "
                f"{esc(item.get('decision_source', 'AUTO'))} · {approval_label}</p>"
                f"<p>Auto event: {esc(auto_title)} · {esc(match['confidence'])} · score {esc(match['score'])}</p>"
                f"<p>Auto recommendation: {esc(item.get('auto_recommendation', item['status']))}</p>"
            )
            preview = item.get("contact_sheet") or next(iter(item.get("previews", [])), None)
            if preview:
                parts.append(
                    f'<img loading="lazy" src="{esc(preview)}" alt="Review preview of {esc(item["filename"])}">'
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
            for reason in (
                match["reasons"]
                + item["selection_reasons"]
                + item["warnings"]
                + item.get("review_warnings", [])
            ):
                parts.append(f"<li>{esc(reason)}</li>")
            for key in ("exact_duplicate_of", "near_duplicate_of"):
                if item.get(key):
                    parts.append(f"<li>{esc(key)}: {esc(item[key])}</li>")
            parts.append("</ul>")
            if human:
                parts.append(
                    f"<p>Reviewed: {esc(human['updated_at'])} · revision {human['revision']}</p>"
                    f"<p>Notes: {esc(human.get('note', ''))}</p>"
                )
                if human.get("rejected_event_ids"):
                    parts.append(f"<p>Rejected event IDs: {esc(', '.join(human['rejected_event_ids']))}</p>")
            for segment in item.get("effective_highlights", item.get("highlights", [])):
                range_text = f"{clock(segment['start_seconds'])}–{clock(segment['end_seconds'])}"
                label = (
                    "PENDING"
                    if segment.get("approved") is None
                    else "APPROVED"
                    if segment["approved"]
                    else "REJECTED"
                )
                parts.append(
                    f"<p><b>{range_text}</b> · {label} — {esc(segment.get('reason', 'Human range'))}</p>"
                )
            if match.get("alternatives"):
                parts.append("<details><summary>Alternative event matches</summary><ul>")
                for alternative in match["alternatives"]:
                    name = events.get(alternative["event_id"], {}).get("title", alternative["event_id"])
                    parts.append(
                        f"<li>{esc(name)}: {esc(alternative['score'])} — "
                        f"{esc('; '.join(alternative['reasons']))}</li>"
                    )
                parts.append("</ul></details>")
            if token:
                parts.append(controls(item, manifest["events"], token))
            parts.append("</article>")
        parts.append("</section>")
    if manifest["ignored"]:
        parts.append("<details><summary>Ignored files</summary><ul>")
        parts.extend(f"<li>{esc(i['path'])}: {esc(i['reason'])}</li>" for i in manifest["ignored"])
        parts.append("</ul></details>")
    parts.append("</body></html>")
    return "".join(parts)
