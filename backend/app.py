import os
import json
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

# Import AI Logic (Ensure these exist in your ai_engine folder)
from ai_engine.step1_structure import get_exam_structure
from ai_engine.step2_faculty import create_faculty_key
from ai_engine.step3_student import extract_student_answers
from ai_engine.step4_grading import grade_student_paper

app = Flask(__name__, 
            template_folder='../frontend/templates', 
            static_folder='../frontend/static')

# Enable CORS for all routes with specific configuration
CORS(app, 
     supports_credentials=True,
     origins=['http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5000', 'http://localhost:5000'],
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'OPTIONS'])

app.secret_key = 'super_secret_key_for_demo'

# Configuration
BASE_DIR = os.path.dirname(__file__)
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')
USER_DB_FILE = os.path.join(BASE_DIR, 'users.json') # Simple JSON Database

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

FILES = {
    "question": "question_paper.pdf",
    "faculty": "faculty_solution.pdf",
    "student": "student_answer.pdf"
}

# --- USER MANAGEMENT HELPER FUNCTIONS ---
def load_users():
    if not os.path.exists(USER_DB_FILE):
        return {}
    with open(USER_DB_FILE, 'r') as f:
        return json.load(f)

def save_users(users):
    with open(USER_DB_FILE, 'w') as f:
        json.dump(users, f, indent=4)

# --- ROUTES ---

@app.route('/')
def index():
    if 'username' in session:
        role = session.get('role')
        if role == 'faculty': return redirect(url_for('faculty_dashboard'))
        if role == 'student': return redirect(url_for('student_dashboard'))
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role'] # 'student' or 'faculty'
        
        users = load_users()

        if username in users:
            flash("Username already exists!", "error")
            return redirect(url_for('signup'))

        # Create new user
        users[username] = {
            "password": generate_password_hash(password),
            "role": role
        }
        save_users(users)
        
        flash("Account created! Please log in.", "success")
        return redirect(url_for('index'))

    return render_template('signup.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    
    users = load_users()

    if username in users and check_password_hash(users[username]['password'], password):
        session['username'] = username
        session['role'] = users[username]['role']
        
        if users[username]['role'] == 'faculty':
            return redirect(url_for('faculty_dashboard'))
        else:
            return redirect(url_for('student_dashboard'))
    else:
        flash("Invalid Username or Password", "error")
        return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/faculty')
def faculty_dashboard():
    if session.get('role') != 'faculty': return redirect(url_for('index'))
    return render_template('faculty.html', username=session.get('username'))

@app.route('/student')
def student_dashboard():
    if session.get('role') != 'student': return redirect(url_for('index'))
    return render_template('student.html', username=session.get('username'))

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files: return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    doc_type = request.form.get('type')

    if file.filename == '': return jsonify({"error": "No selected file"}), 400

    if file:
        filename = FILES[doc_type]
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)
        return jsonify({"message": f"{doc_type.capitalize()} uploaded successfully!"})

@app.route('/run_grading', methods=['POST'])
def run_grading():
    try:
        q_path = os.path.join(app.config['UPLOAD_FOLDER'], FILES["question"])
        f_path = os.path.join(app.config['UPLOAD_FOLDER'], FILES["faculty"])
        s_path = os.path.join(app.config['UPLOAD_FOLDER'], FILES["student"])

        if not (os.path.exists(q_path) and os.path.exists(f_path) and os.path.exists(s_path)):
            return jsonify({"error": "Missing files. Upload all PDFs first."}), 400

        print("--- Step 1: Extracting Exam Structure ---")
        with open(q_path, "rb") as f: q_bytes = f.read()
        structure = get_exam_structure(q_bytes)
        
        print("--- Step 2: Creating Faculty Key ---")
        with open(f_path, "rb") as f: f_bytes = f.read()
        faculty_key = create_faculty_key(structure, f_bytes)
        
        print("--- Step 3: Extracting Student Answers ---")
        with open(s_path, "rb") as f: s_bytes = f.read()
        student_answers = extract_student_answers(structure, s_bytes)
        
        print("--- Step 4: Grading Paper ---")
        final_report = grade_student_paper(student_answers, faculty_key)
        
        print("--- Grading Complete! ---")
        
        # Save results to session and file
        session['last_grading_result'] = final_report
        result_file = os.path.join(OUTPUT_FOLDER, f'result_{session.get("username", "student")}.json')
        with open(result_file, 'w') as f:
            json.dump(final_report, f, indent=2)
        
        return jsonify(final_report), 200

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/get_results', methods=['GET'])
def get_results():
    """Retrieve saved grading results"""
    # Try to get from session first
    if 'last_grading_result' in session:
        return jsonify(session['last_grading_result']), 200
    
    # Try to get from file
    username = session.get('username', 'student')
    result_file = os.path.join(OUTPUT_FOLDER, f'result_{username}.json')
    
    if os.path.exists(result_file):
        with open(result_file, 'r') as f:
            result = json.load(f)
        return jsonify(result), 200
    
    return jsonify({"error": "No results found"}), 404

@app.route('/results')
def results_page():
    """Serve the results page"""
    if 'username' not in session:
        return redirect(url_for('index'))
    return render_template('results.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)