#!/usr/bin/env python3
"""
Simple script to run the AdHub Telegram Bot
"""

import sys
import os
from pathlib import Path

# Add src directory to Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import and run the main function
from main import main

if __name__ == "__main__":
    import asyncio
    asyncio.run(main()) 