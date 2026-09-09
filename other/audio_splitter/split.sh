#!/usr/bin/env bash

INPUT_FILE="$1"
OUT_DIR="./result"

# Match your exact Audacity settings:
SILENCE_DB="-30dB"
SILENCE_DURATION="1.0"
PAD_LEAD="0.2"
PAD_TRAIL="0.2"

if [ -z "$INPUT_FILE" ] || [ ! -f "$INPUT_FILE" ]; then
    echo "Usage: $0 <audio_file>"
    exit 1
fi

# Ensure the result directory exists
mkdir -p "$OUT_DIR"

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
                # Save into the targeted result directory
                NEW_NAME=$(printf "saved_chunk_%03d.$EXT" "$KEEP_COUNTER")
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

echo "--------------------------------------------------------"
echo "Done! Kept $((KEEP_COUNTER-1)) chunks inside '$OUT_DIR/'."

