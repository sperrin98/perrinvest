from dotenv import load_dotenv
import os

# Specify the correct path to the .env file
load_dotenv('app/.env')  # Ensure this path is correct

# Print the loaded environment variables
print(f"SECRET_KEY: {os.getenv('SECRET_KEY')}")
print(f"DB_HOST: {os.getenv('DB_HOST')}")
print(f"REACT_APP_API_URL: {os.getenv('REACT_APP_API_URL')}")
