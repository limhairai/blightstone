#!/bin/bash
ENV=${1:-development}
echo "Setting environment to: $ENV"
cp frontend/.env.$ENV frontend/.env.local
cp backend/.env.$ENV backend/.env
