#!/bin/bash

# Configuration
API_URL="http://localhost:5050/v1/audio/speech"
API_KEY="your_api_key_here"

# Check for correct arguments
if [ $# -ne 2 ]; then
    echo "❌ Usage: $0 <path_to_sentence_file.txt> <target_output_folder>"
    exit 1
fi

FILE_PATH="$1"
OUTPUT_DIR="$2"

# Check if input file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "❌ Error: Input file '$FILE_PATH' not found."
    exit 1
fi

# Create target output folder if it doesn't exist
if [ ! -d "$OUTPUT_DIR" ]; then
    echo "📁 Creating output directory at: $OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"
fi

# Track toggle state (0 = Xiaoxiao, 1 = Yunxi)
toggle=0
count=1

echo "📦 Generating Chinese Audio Files named by sentence..."
echo "=================================================="

# Read the file line by line
while IFS= read -r line || [ -n "$line" ]; do
    # Trim whitespace and skip empty lines or comments
    line=$(echo "$line" | xargs)
    [[ -z "$line" || "$line" =~ ^# ]] && continue

    # Alternate voice parameters
    if [ $toggle -eq 0 ]; then
        VOICE="zh-CN-XiaoxiaoNeural"
        AVATAR="👩 [Xiaoxiao]"
        toggle=1
    else
        VOICE="zh-CN-YunxiNeural"
        AVATAR="👨 [Yunxi]"
        toggle=0
    fi

    # SANITIZE FILENAME: Remove characters that break file layouts (/, \, ?, *, :, |, ", <, >)
    # Also strip common Chinese full-width punctuation marks like ？，。！
    CLEAN_NAME=$(echo "$line" | sed 's/[/\\?*:|"<>]//g' | sed 's/[？，。！]//g' | tr -d '[:space:]')
    
    # Fallback if cleaning completely emptied the line
    if [ -z "$CLEAN_NAME" ]; then
        CLEAN_NAME="sentence_${count}"
    fi

    FILENAME="${CLEAN_NAME}.mp3"
    FULL_OUTPUT_PATH="${OUTPUT_DIR}/${FILENAME}"

    echo "🔢 Processing Item $count..."
    echo "$AVATAR -> $FILENAME"
    echo "--------------------------------------------------"

    # Request the audio stream and save it
    curl -s "$API_URL" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"model\": \"tts-1\",
        \"input\": \"$(echo "$line" | sed 's/"/\\"/g')\",
        \"voice\": \"$VOICE\"
      }" -o "$FULL_OUTPUT_PATH"

    ((count++))
done < "$FILE_PATH"

echo ""
echo "✅ Done! All audio files saved successfully to: $OUTPUT_DIR"
ls -1 "$OUTPUT_DIR"

