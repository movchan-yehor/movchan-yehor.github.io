import json, re, sys

def compact_data(obj):
    if isinstance(obj, list):
        return [compact_data(i) for i in obj]
    if isinstance(obj, dict):
        if 'data' in obj and isinstance(obj['data'], list):
            obj = {**obj, 'data': ['__ROW__' + json.dumps(r, ensure_ascii=False) for r in obj['data']]}
        return {k: compact_data(v) for k, v in obj.items()}
    return obj

filename = sys.argv[1] if len(sys.argv) > 1 else None

# Спробуємо різні кодування
encodings = ['utf-8', 'utf-8-sig', 'cp1251', 'cp866']
data = None
for enc in encodings:
    try:
        with (open(filename, encoding=enc) if filename else sys.stdin) as f:
            data = json.load(f)
        break
    except (UnicodeDecodeError, json.JSONDecodeError):
        continue

if data is None:
    print("Помилка: не вдалося визначити кодування файлу", file=sys.stderr)
    sys.exit(1)

transformed = compact_data(data)
output = json.dumps(transformed, ensure_ascii=False, indent=2)

def unescape_row(m):
    inner = m.group(1)
    inner = inner.replace('\\"', '"')
    return inner

output = re.sub(r'"__ROW__(\{(?:[^"\\]|\\.)*\})"', unescape_row, output)

# Зберігаємо у UTF-8
sys.stdout.reconfigure(encoding='utf-8')
print(output)