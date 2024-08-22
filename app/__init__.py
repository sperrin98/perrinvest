from flask import Flask, send_from_directory

def create_app():
    app = Flask(__name__, static_folder='static', static_url_path='/')
    
    @app.route('/')
    @app.route('/<path:path>')
    def serve(path=None):
        if path is None or path == '':
            path = 'index.html'
        return send_from_directory(app.static_folder, path)

    return app