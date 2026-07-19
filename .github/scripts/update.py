import os, re, sys

# ── Column name → array index mapping ────────────────────────────────────────
COLUMN_MAP = {
    "docs received":                 1,
    "categorization / checks":       2,
    "reconciliation":                3,
    "journal entries":               4,
    "ready for review":              5,
    "manager review":                6,
    "client notified":               8,
    "issues / flagged transactions": 9,
}

# ── Parse issue body ──────────────────────────────────────────────────────────
body = os.environ.get("ISSUE_BODY", "")

def get_field(label):
    m = re.search(rf"\*\*{re.escape(label)}:\*\*\s*(.+)", body)
    return m.group(1).strip() if m else ""

client  = get_field("Client Name")
column  = get_field("Column to Update").lower()
status  = get_field("New Status")
issue   = get_field("Issues / Flagged Transactions")
overall = get_field("Overall Completion")

if not client or not column or not status:
    print("ERROR: Missing required fields.")
    sys.exit(1)

col_idx = COLUMN_MAP.get(column)
if col_idx is None and column != "overall status":
    print(f"ERROR: Unknown column '{column}'")
    sys.exit(1)

# ── Read index.html ───────────────────────────────────────────────────────────
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# ── Find and update the account row ──────────────────────────────────────────
# Each row is a JS array on one line starting with ["ClientName",
escaped = re.escape(client)
pattern = rf'(\["{escaped}"(?:,"[^"]*")*\])'

match = re.search(pattern, html)
if not match:
    print(f"ERROR: Client '{client}' not found in data.")
    sys.exit(1)

old_row = match.group(1)

# Parse the array values
values = re.findall(r'"([^"]*)"', old_row)

def apply_status(val):
    # Map friendly labels to stored values
    mapping = {
        "complete":     "Complete",
        "in progress":  "In Progress",
        "not started":  "Not Started",
        "yes":          "Yes",
        "no":           "No",
        "n/a":          "",
    }
    return mapping.get(val.lower(), val)

# Apply column update
if col_idx is not None:
    values[col_idx] = apply_status(status)

# Apply issues field if provided and not blank/dash
if issue and issue != "—":
    values[9] = issue
elif col_idx == 9:
    values[9] = apply_status(status)

# Apply overall status → sets manager review field
overall_map = {
    "completed":       "Complete",
    "in process":      "In Progress",
    "not yet started": "",
}
if overall and overall.lower() in overall_map:
    values[6] = overall_map[overall.lower()]

# Rebuild the row
new_row = "[" + ",".join(f'"{v}"' for v in values) + "]"
new_html = html.replace(old_row, new_row, 1)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(new_html)

print(f"SUCCESS: Updated '{client}' — {column} → {status}")
