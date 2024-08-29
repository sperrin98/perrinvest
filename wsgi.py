import sys
import os

# Ensure that the correct path is being used
print("Current working directory:", os.getcwd())
print("Python path:", sys.path)

from app import create_app

app = create_app()
