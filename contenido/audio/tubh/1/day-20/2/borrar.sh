#!/bin/bash
# estoy usando esto para 
# escuchar los audios mientras los
# voy agregando al quiz

for file in $(ls *.mp3 | sort -n); do
    mpv "$file"
    read -n 1 -s -r -p "Press any key to continue..."
    echo
done

