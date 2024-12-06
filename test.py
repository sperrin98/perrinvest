import os
from dotenv import load_dotenv

# Ensure dotenv is loading from the correct path (relative to this script)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Get the DB_HOST from environment variables
db_host = os.getenv('DB_HOST')

# Print the host to the command line
print(f"The database host is: {db_host}")
