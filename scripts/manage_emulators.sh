#!/bin/bash
set -ex # Enable xtrace and errexit

# Script to reset and start Firebase emulators
# Call with: ./scripts/manage_emulators.sh start
# Call with: ./scripts/manage_emulators.sh stop 

ACTION=$1
# Assuming this script is in project_root/scripts/, so project_root is one level up.
FIREBASE_PROJECT_ROOT="." 
# Ensure your firebase.json is in this FIREBASE_PROJECT_ROOT directory.
# This is the directory where 'firebase emulators:start' will be run from.

EMULATOR_EXPORT_DIR_NAME="firebase_emulator_data" # Choose a consistent name for data export/cleanup
FIREBASE_PROJECT_ID="ad-hub-d1c0a" # Corrected to match Admin SDK

# Navigate to the directory of the script first, then to project root if structure is complex.
# For simplicity, assuming this script is run from where it can find firebase CLI and target FIREBASE_PROJECT_ROOT.
# If FIREBASE_PROJECT_ROOT is actually the CWD where playwright invokes this, then cd isn't needed here.

if [ "$ACTION" == "start" ]; then
  echo ">>> (DEBUG) Current directory: $(pwd)"
  echo ">>> (DEBUG) Cleaning old Firebase emulator data from ${FIREBASE_PROJECT_ROOT}/${EMULATOR_EXPORT_DIR_NAME}..."
  rm -rf "${FIREBASE_PROJECT_ROOT}/${EMULATOR_EXPORT_DIR_NAME}" 
  # You might also want to delete specific firestore-debug.log, etc.
  # rm -f "${FIREBASE_PROJECT_ROOT}/firestore-debug.log"
  # rm -f "${FIREBASE_PROJECT_ROOT}/ui-debug.log"
  # rm -f "${FIREBASE_PROJECT_ROOT}/hub-debug.log"
  # rm -f "${FIREBASE_PROJECT_ROOT}/auth-debug.log"

  echo ">>> (DEBUG) Will run: firebase --project=${FIREBASE_PROJECT_ID} emulators:start --only auth,firestore --export-on-exit=\"./${EMULATOR_EXPORT_DIR_NAME}\""
  # Run in foreground for Playwright to manage its lifecycle directly
  firebase --project=${FIREBASE_PROJECT_ID} emulators:start --only auth,firestore --export-on-exit="./${EMULATOR_EXPORT_DIR_NAME}"
  echo ">>> (DEBUG) Firebase emulators:start command finished (should not happen if it runs as a server)."

elif [ "$ACTION" == "stop" ]; then
  echo ">>> Stopping Firebase Emulators (using .emulator_pid, if created by a backgrounded version)..."
  if [ -f .emulator_pid ]; then
    echo "Found PID file, attempting to kill PID $(cat .emulator_pid)"
    kill "$(cat .emulator_pid)" && echo "Kill signal sent."
    rm .emulator_pid
  else
    echo ">>> PID file .emulator_pid not found. Assumes Playwright will handle termination of foreground process or manual stop needed."
  fi
else
  echo "Usage: $0 [start|stop]"
  exit 1
fi 