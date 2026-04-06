#!/bin/bash
set -euo pipefail

NOTES_FILE="docs/project-notes.md"
TODO_FILE="docs/todo.md"

notes=""
todo=""

if [ -f "$NOTES_FILE" ]; then
  notes=$(cat "$NOTES_FILE")
fi

if [ -f "$TODO_FILE" ]; then
  todo=$(cat "$TODO_FILE")
fi

jq -n \
  --arg notes "$notes" \
  --arg todo "$todo" \
  '{
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext:
        "Avant de coder, respecte impérativement ce contexte projet.\n\n" +
        "REMARQUES PROJET:\n" + $notes + "\n\n" +
        "TODO ACTUELLE:\n" + $todo + "\n\n" +
        "Obligations:\n" +
        "- lire et respecter ces remarques avant toute modification\n" +
        "- annoncer brièvement le plan\n" +
        "- mettre à jour la todo si la tâche évolue\n" +
        "- faire des changements minimaux et ciblés\n"
    }
  }'
