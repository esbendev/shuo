# Audio Splitter

This utility splits an audio file into smaller chunks based on silence detection and then lets you review each generated segment interactively before keeping or discarding it.

It is especially useful for language study workflows where you want to break a long recording into short, reviewable audio clips for repetition, vocabulary practice, or sentence study.

## What it does

The script:

- accepts an input audio file
- analyzes silence using ffmpeg
- detects pause points similar to Audacity silence handling
- creates small chunks with slight padding before and after the silence boundary
- transcodes each chunk to MP3 for cleaner handling
- plays each chunk with mpv
- asks whether to keep, discard, or replay the segment
- saves accepted chunks into the result folder

## Why this exists

Long audio files are often hard to review efficiently. This script helps you cut recordings into digestible pieces and review them one by one without manually editing the file in a DAW or complex editor.

It is especially well suited for:

- listening practice
- sentence extraction
- vocabulary review
- chunking spoken audio into reusable study clips

## Requirements

You need the following tools installed on your system:

- bash
- ffmpeg
- mpv
- bc

### Install on Linux (example)

```bash
sudo apt update
sudo apt install ffmpeg mpv bc
```

## Usage

Run the script like this:

```bash
./split.sh /path/to/audio.mp3
```

Or:

```bash
bash split.sh /path/to/audio.mp3
```

## Output behavior

The script creates a folder named result in the same directory as the script and stores accepted clips there.

Example:

```text
other/audio_splitter/
├── split.sh
├── result/
│   ├── saved_chunk_001.mp3
│   ├── saved_chunk_002.mp3
│   └── saved_chunk_003.mp3
└── README.md
```

## Interactive review process

After the script cuts the track, it enters a review loop for each chunk.

For every segment it shows:

- the chunk filename
- a playback prompt
- available choices:
  - y: keep the chunk
  - n: discard the chunk
  - r: replay the chunk

This lets you manually curate the extracted segments before keeping them.

## Silence detection settings

The script uses Audacity-inspired parameters:

```bash
SILENCE_DB="-30dB"
SILENCE_DURATION="1.0"
PAD_LEAD="0.2"
PAD_TRAIL="0.2"
```

### Meaning

- SILENCE_DB: threshold used to decide whether a section counts as silence
- SILENCE_DURATION: minimum silence duration required to split
- PAD_LEAD: how much earlier to start the chunk before the silence boundary
- PAD_TRAIL: how much later to end the chunk after the silence boundary

These values are intentionally tuned for natural language audio and can be adjusted if you want a tighter or looser split.

## How the script works internally

The process is roughly:

1. validate the input audio file
2. create the result folder
3. detect silence timestamps with ffmpeg
4. build chunks between silence sections
5. pad the chunk boundaries slightly to avoid cutting off speech too aggressively
6. export each chunk as MP3
7. play each candidate chunk with mpv
8. ask the user to keep or reject it
9. move the accepted clips into result/
10. clean up the temporary working folder

## Important notes

- The script is designed for short review workflows, not for professional audio editing.
- Accepted files are saved as MP3 in the result directory.
- It is interactive, so you need to be present to decide which chunks to keep.
- The script is intentionally conservative: it creates clips, then gives you control over the final set.

## Example

```bash
cd other/audio_splitter
./split.sh ~/Downloads/lesson_audio.m4a
```

Then the tool will:

- split the file into silence-based sections
- play each chunk
- ask for yes/no/replay
- save the accepted segments to result/

## Troubleshooting

### Command says usage error

This usually means the path to the audio file is missing or invalid.

Verify that the file exists:

```bash
ls -l /path/to/audio.mp3
```

### ffmpeg or mpv not found

Install the required dependencies:

```bash
sudo apt install ffmpeg mpv bc
```

### Output folder is empty

If the script runs but does not keep any chunks, it may be because:

- silence detection found no usable pause points
- the audio is too quiet or too continuous
- the thresholds are too strict for the source audio

You can adjust the silence parameters in the script.

## Customizing the behavior

If you want different chunking behavior, edit the values near the top of the script:

```bash
SILENCE_DB="-30dB"
SILENCE_DURATION="1.0"
PAD_LEAD="0.2"
PAD_TRAIL="0.2"
```

Lower or raise these values depending on how much silence exists in your recordings.

## Summary

This tool is a simple but effective workflow for turning long speaking recordings into short, reviewable study clips. It balances automation with manual control, which makes it very practical for language learning and audio-based study routines.
