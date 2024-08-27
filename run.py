import sys
from app import create_app, db
from flask_migrate import upgrade

app = create_app()

def main():
    if len(sys.argv) > 1:
        if sys.argv[1] == 'db' and len(sys.argv) > 2:
            if sys.argv[2] == 'upgrade':
                with app.app_context():
                    upgrade()
            else:
                print("Usage: python run.py db upgrade")
        else:
            print("Usage: python run.py db upgrade")
    else:
        app.run()  # Only run the server if no arguments are provided

if __name__ == "__main__":
    main()
