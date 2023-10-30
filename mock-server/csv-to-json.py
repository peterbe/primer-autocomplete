import csv
import json
import sys
from pathlib import Path
file = Path(sys.argv[1])
assert file.suffix == '.csv', file.suffix
all = []
seen = set()
with open(file) as f:
    reader = csv.reader(f)
    next(reader) # skip header
    for row in reader:
        k = row[0].strip().lower()
        if k in seen:
            continue
        seen.add(k)
        all.append({
            'query': row[0],
            'count': int(row[1]),
        })

dest = Path(str(file).replace('.csv', '.json'))
with open(dest, 'w') as f:
    json.dump(all, f, indent=2)
