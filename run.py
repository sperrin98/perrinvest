from flask import Flask

# Create the Flask app
app = Flask(__name__)

# Ensure the Flask app is accessible from any network by binding it to 0.0.0.0
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
