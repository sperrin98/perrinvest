import sys
from app import create_app
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
        # Run the app in production mode
        app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

if __name__ == "__main__":
    main()
