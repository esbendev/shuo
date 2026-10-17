#!/usr/bin/env bash

INPUT_FILE="${1:-}"
OUT_DIR="${2:-}"

# Match your exact Audacity settings:
SILENCE_DB="-30dB"
SILENCE_DURATION="1.0"
PAD_LEAD="0.2"
PAD_TRAIL="0.2"

if [ -z "$INPUT_FILE" ] || [ ! -f "$INPUT_FILE" ]; then
    echo "Usage: $0 <audio_file> <output_directory_full_path>"
    exit 1
fi

if [ -z "$OUT_DIR" ]; then
    echo "Usage: $0 <audio_file> <output_directory_full_path>"
    exit 1
fi

# Force a full path for the destination and create it if needed.
if [[ "$OUT_DIR" != /* ]]; then
    OUT_DIR="$(pwd)/$OUT_DIR"
fi
mkdir -p "$OUT_DIR"
OUT_DIR="$(cd "$OUT_DIR" && pwd)"

# Target output format to fix M4A cutting issues perfectly
EXT="mp3"
TMP_DIR=$(mktemp -d -t study_chunks_XXXXXX)
echo "--> Auto-splitting file using Audacity settings..."

# 1. Detect silence and get timestamps
mapfile -t TIMESTAMPS < <(ffmpeg -i "$INPUT_FILE" -af "silencedetect=noise=${SILENCE_DB}:d=${SILENCE_DURATION}" -f null - 2>&1 | \
    awk '/silence_start/ {printf "%s ", $5} /silence_end/ {print $5}')

PREV_END="0"
COUNTER=1

for LINE in "${TIMESTAMPS[@]}"; do
    read -r START END <<< "$LINE"
    
    # Apply Audacity style padding: 
    # Start the speech chunk slightly earlier, end it slightly later
    CHUNK_START=$(echo "$PREV_END - $PAD_LEAD" | bc)
    CHUNK_END=$(echo "$START + $PAD_TRAIL" | bc)
    
    # Safety checks to keep timestamps inside bounds
    if (( $(echo "$CHUNK_START < 0" | bc -l) )); then CHUNK_START="0"; fi
    DURATION=$(echo "$CHUNK_END - $CHUNK_START" | bc)
    
    if (( $(echo "$DURATION > 0.2" | bc -l) )); then
        # Transcode to high quality MP3 to honor precision cuts on .m4a
        ffmpeg -y -ss "$CHUNK_START" -to "$CHUNK_END" -i "$INPUT_FILE" -c:a libmp3lame -q:a 2 "$TMP_DIR/chunk_$(printf "%03d" $COUNTER).$EXT" 2>/dev/null
        ((COUNTER++))
    fi
    PREV_END="$END"
done

# Final chunk handling from the last silence block to the end of the track
CHUNK_START=$(echo "$PREV_END - $PAD_LEAD" | bc)
if (( $(echo "$CHUNK_START < 0" | bc -l) )); then CHUNK_START="0"; fi
ffmpeg -y -ss "$CHUNK_START" -i "$INPUT_FILE" -c:a libmp3lame -q:a 2 "$TMP_DIR/chunk_$(printf "%03d" $COUNTER).$EXT" 2>/dev/null

echo "--> Found $(ls "$TMP_DIR" | wc -l) chunks. Starting review process..."
echo "--------------------------------------------------------"

# 2. Interactive Review Loop
KEEP_COUNTER=1

for FILE in "$TMP_DIR"/*."$EXT"; do
    [ -e "$FILE" ] || continue
    
    while true; do
        clear
        echo "Reviewing chunk: $(basename "$FILE")"
        echo "---------------------------------------------"
        echo "Playing audio now..."
        
        # Play the file using mpv
        mpv --no-video "$FILE" > /dev/null 2>&1
        
        echo "---------------------------------------------"
        read -r -p "Keep this chunk? [y]es / [n]o / [r]eplay: " CHOICE
        
        case "$CHOICE" in
            [Yy]* )
                # Save into the targeted result directory using plain numeric names.
                while [[ -e "$OUT_DIR/$KEEP_COUNTER.$EXT" ]]; do
                    ((KEEP_COUNTER++))
                done
                NEW_NAME="$KEEP_COUNTER.$EXT"
                mv "$FILE" "$OUT_DIR/$NEW_NAME"
                echo "--> Kept! Saved to $OUT_DIR/$NEW_NAME"
                ((KEEP_COUNTER++))
                sleep 0.5
                break
                ;;
            [Nn]* )
                echo "--> Discarded."
                rm "$FILE"
                sleep 0.5
                break
                ;;
            [Rr]* )
                # Loops back to play again
                continue
                ;;
            * )
                echo "Invalid input. Please enter y, n, or r."
                sleep 1
                ;;
        esac
    done
done

# Cleanup temporary folder
rm -rf "$TMP_DIR"

# Normalize the saved files before the final playback pass.
echo "--------------------------------------------------------"
echo "Normalizing saved MP3 files..."
(
    cd "$OUT_DIR"
    find . -type f -name "*.mp3" -exec ffmpeg-normalize {} -c:a libmp3lame -b:a 192k -t -16 -o {} -f \;
)

echo "--------------------------------------------------------"
# Review the saved mp3s in numeric order, one file at a time.
PLAYLIST_FILE=$(mktemp)
find "$OUT_DIR" -maxdepth 1 -type f -name '*.mp3' -printf '%p\n' | sort -V > "$PLAYLIST_FILE"
if [ -s "$PLAYLIST_FILE" ]; then
    MPV_INPUT_CONF=$(mktemp)
    cat > "$MPV_INPUT_CONF" <<'EOF'
SPACE playlist-next
n playlist-next
N playlist-prev
EOF
    echo "--------------------------------------------------------"
    echo "Reviewing saved files in numeric order (1, 2, 3, 10, 11, ...)."
    echo "Press n or Space in mpv to advance to the next file."
    mpv --no-video --quiet --playlist="$PLAYLIST_FILE" --input-conf="$MPV_INPUT_CONF"
    rm -f "$MPV_INPUT_CONF"
fi
rm -f "$PLAYLIST_FILE"

echo "--------------------------------------------------------"
echo "Done! Kept $((KEEP_COUNTER-1)) chunks inside '$OUT_DIR/'."

