from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime
from transformers import pipeline
from dotenv import load_dotenv

# Sentiment pipeline from hugging face
sentiment_model = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")


app = Flask(__name__)
CORS(app)

# Setup the database URI to point to Docker local server 
load_dotenv()
db_url = os.getenv("DATABASE_URL")
app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Define your model (table)
class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    sentiment_label = db.Column(db.String(20))
    sentiment_score = db.Column(db.Float)

# API route to get all feedback
@app.route('/api/feedback', methods=['GET'])
def get_feedback():
    feedback_list = Feedback.query.order_by(Feedback.timestamp.desc()).all()
    return jsonify([
        {
            'id': f.id,
            'name': f.name,
            'message': f.message,
            'timestamp': f.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'sentiment_label': f.sentiment_label,
            'sentiment_score': f.sentiment_score
        } for f in feedback_list
    ])


# API route to submit new feedback
@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    name = data.get('name')
    message = data.get('message')

    if not name or not message:
        return jsonify({'error': 'Name and message are required'}), 400

    # Analyze sentiment
    result = sentiment_model(message)[0]
    sentiment_label = result['label']
    sentiment_score = float(result['score'])

    # Create new feedback entry with sentiment
    new_entry = Feedback(
        name=name,
        message=message,
        sentiment_label=sentiment_label,
        sentiment_score=sentiment_score
    )
    db.session.add(new_entry)
    db.session.commit()

    return jsonify({'message': 'Feedback submitted successfully'}), 201


if __name__ == '__main__':
    app.run(debug=True)
