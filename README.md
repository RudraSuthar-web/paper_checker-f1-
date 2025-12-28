# Paper Checker

An AI-powered automated paper grading system built with Flask and Google's Gemini API.

## Features

- User authentication (signup/login)
- Role-based access (Faculty and Student)
- PDF upload and processing
- AI-driven grading pipeline
- Web-based interface

## Project Structure

```
paper_checker/
├── README.md
├── backend/
│   ├── app.py                 # Flask application
│   ├── config.py              # Configuration and API setup
│   ├── main.py                # Standalone grading script
│   ├── users.json             # User database (JSON)
│   ├── utils.py               # Utility functions
│   ├── ai_engine/
│   │   ├── __init__.py
│   │   ├── step1_structure.py # Exam structure extraction
│   │   ├── step2_faculty.py   # Faculty key creation
│   │   ├── step3_student.py   # Student answer extraction
│   │   └── step4_grading.py   # Grading logic
│   ├── uploads/               # Uploaded files
│   └── outputs/               # Generated outputs
└── frontend/
    ├── static/
    │   └── style.css          # CSS styles
    └── templates/
        ├── index.html         # Home page
        ├── signup.html        # User registration
        ├── faculty.html       # Faculty dashboard
        ├── student.html       # Student dashboard
        └── results.html       # Grading results
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/RudraSuthar-web/paper_checker-f1-.git
   cd paper_checker-f1-
   ```

2. Install dependencies:
   ```bash
   pip install flask flask-cors werkzeug google-genai
   ```

3. Set up environment variable for Gemini API:
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```

## Usage

### Running the Application

1. Start the Flask server:
   ```bash
   cd backend
   python app.py
   ```

2. Open your browser and go to `http://localhost:5000`

### User Roles

- **Faculty**: Upload question papers and solution keys
- **Student**: Upload answer sheets for grading

### Standalone Grading

For testing the AI pipeline without the web interface:
```bash
cd backend
python main.py
```

## Requirements

- Python 3.8+
- Flask
- Google Gemini API key
- PDF processing libraries (handled by AI engine)

## Contributing

Feel free to submit issues and pull requests.