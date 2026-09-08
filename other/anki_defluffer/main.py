import sys
import os
import re
import tempfile

try:
    from anki.collection import Collection, ImportAnkiPackageRequest
except ImportError:
    Collection = None
    ImportAnkiPackageRequest = None


def build_output_path(anki_decks_path, result_name, subdir_name):
    deck_dir = os.path.abspath(anki_decks_path)
    target_dir = os.path.join(deck_dir, subdir_name)
    os.makedirs(target_dir, exist_ok=True)

    if not result_name:
        raise ValueError("result_name cannot be empty")

    if os.path.splitext(result_name)[1].lower() not in ['.txt', '.tsv', '.csv']:
        result_name = f"{result_name}.txt"

    return os.path.join(target_dir, result_name)


def normalize_field(value):
    if value is None:
        return ""
    cleaned = str(value)
    cleaned = re.sub(r'\[sound:[^\]]+\]', '', cleaned)
    cleaned = cleaned.replace('\r', ' ').replace('\n', ' ')
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


def build_formatted_answer(fields):
    answer_parts = [normalize_field(field) for field in fields[1:] if normalize_field(field)]
    if not answer_parts:
        return ""

    if len(answer_parts) == 1:
        answer = answer_parts[0]
    else:
        primary = ' '.join(answer_parts[:-1]).strip()
        english = answer_parts[-1].strip()
        if primary and english:
            answer = f'{primary} <span class="english">{english}</span>'
        else:
            answer = ' '.join(answer_parts).strip()

    return answer


def format_note_as_html(note):
    fields = [normalize_field(field) for field in note.fields]
    fields = [field for field in fields if field]

    if not fields:
        return ""

    chinese = fields[0]
    answer = build_formatted_answer(fields)
    return f'<div class="chineseChars">{chinese}</div>|<div class="answer">{answer}</div>'


def extract_with_anki_api(package_path, anki_decks_path, result_name):
    # Force conversion to pure strings in case something strange is passing an iterable
    if isinstance(package_path, (list, tuple)):
        package_path = package_path[0]
    if isinstance(anki_decks_path, (list, tuple)):
        anki_decks_path = anki_decks_path[0]
    if isinstance(result_name, (list, tuple)):
        result_name = result_name[0]

    package_path = str(package_path)
    anki_decks_path = str(anki_decks_path)
    result_name = str(result_name)

    if Collection is None or ImportAnkiPackageRequest is None:
        raise RuntimeError(
            "The Anki Python package is not installed. Install the 'anki' package first "
            "or run this in the environment that has Anki available."
        )

    if not os.path.exists(package_path):
        print(f"Error: The file '{package_path}' does not exist.")
        sys.exit(1)

    ext = os.path.splitext(package_path)[1].lower()
    if ext not in ['.apkg', '.colpkg']:
        print("Error: Unsupported file format. Please use .apkg or .colpkg")
        sys.exit(1)

    raw_output_path = build_output_path(anki_decks_path, result_name, 'rawDecks')
    formatted_output_path = build_output_path(anki_decks_path, result_name, 'formatedDecks')

    with tempfile.TemporaryDirectory() as tmpdir:
        collection_path = os.path.join(tmpdir, 'collection.anki2')
        col = Collection(collection_path)

        print(f"Importing package via native Anki API: {package_path}...")

        try:
            request = ImportAnkiPackageRequest(package_path=os.path.abspath(package_path))
            col.import_anki_package(request)
        except Exception as e:
            print(f"Error during import: {e}")
            col.close()
            sys.exit(1)

        note_ids = col.find_notes("")
        print(f"Extracting fields for {len(note_ids)} notes...")

        # rawDecks output
        with open(raw_output_path, 'w', encoding='utf-8') as f:
            for nid in note_ids:
                note = col.get_note(nid)
                cleaned_fields = [normalize_field(field) for field in note.fields]
                cleaned_fields = [field for field in cleaned_fields if field]
                line = '\t'.join(cleaned_fields)
                if line:
                    f.write(line + '\n')

        # formatedDecks output
        with open(formatted_output_path, 'w', encoding='utf-8') as f:
            for nid in note_ids:
                note = col.get_note(nid)
                line = format_note_as_html(note)
                if line:
                    f.write(line + '\n')

        col.close()

    print(f"Successfully extracted notes to '{raw_output_path}'")
    print(f"Successfully formatted notes to '{formatted_output_path}'")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python3 main.py <file.apkg|.colpkg> <ankiDecks_path> <result_name>")
        sys.exit(1)

    input_package = sys.argv[1]
    anki_decks_path = sys.argv[2]
    result_name = sys.argv[3]

    extract_with_anki_api(input_package, anki_decks_path, result_name)
