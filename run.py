from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)  # Use `debug=True` for local development
