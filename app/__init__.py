from flask import Flask, send_from_directory

def create_app():
    app = Flask(__name__, static_folder='../frontend/build', template_folder='../frontend/build')

    @app.route('/')
    def index():
        return send_from_directory(app.template_folder, 'index.html')

    @app.route('/<path:path>')
    def static_proxy(path):
        return send_from_directory(app.static_folder, path)

    return app
