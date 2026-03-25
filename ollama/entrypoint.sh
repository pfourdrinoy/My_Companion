#!/bin/bash

ollama serve &

echo "Waiting for Ollama..."
until ollama list > /dev/null 2>&1; do
  sleep 1
done

if ! ollama list | grep -q "gemma3-translator"; then
  echo "Pulling gemma3-translator..."
  ollama pull zongwei/gemma3-translator:4b
fi

echo "Ollama ready."

wait