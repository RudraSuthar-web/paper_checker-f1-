document.addEventListener('DOMContentLoaded', () => {
    // Ensure user is faculty
    const user = db.requireAuth('faculty');
    if (!user) return;

    // Display User Name
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = user.name;

    // Logout Handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            db.logout();
        });
    }

    // --- Dashboard Logic ---
    const dashboardStats = document.getElementById('dashboardStats');
    if (dashboardStats) {
        renderDashboard();
    }

    // --- Create Assignment Logic ---
    const createAssignmentForm = document.getElementById('createAssignmentForm');
    if (createAssignmentForm) {
        setupCreateAssignment();
    }
});

function renderDashboard() {
    const assignments = db.getAssignments();
    const submissions = db.getSubmissions();

    // Update Stats
    document.getElementById('totalAssignments').textContent = assignments.length;

    // Render Recent Assignments
    const listContainer = document.getElementById('recentAssignments');
    listContainer.innerHTML = '';

    if (assignments.length === 0) {
        listContainer.innerHTML = '<p>No assignments created yet.</p>';
        return;
    }

    assignments.slice(0, 5).forEach(asg => {
        const subCount = submissions.filter(s => s.assignmentId === asg.id).length;
        const item = document.createElement('div');
        item.className = 'assignment-item';
        item.innerHTML = `
            <div class="assignment-info">
                <h3>${asg.title}</h3>
                <p>${asg.description}</p>
                <div class="assignment-meta">
                    <span>Deadline: ${asg.deadline}</span> • 
                    <span>Questions: ${asg.questions.length}</span>
                </div>
            </div>
            <div style="display: flex; gap: 1rem; align-items: center;">
                 <span class="badge badge-blue">Active</span>
                 <button class="btn btn-secondary btn-sm" onclick="viewSubmissions('${asg.id}', '${asg.title.replace(/'/g, "\\'")}')">
                    View Submissions (${subCount})
                 </button>
            </div>
        `;
        listContainer.appendChild(item);
    });

    // Modal Close
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
        closeBtn.onclick = () => {
            document.getElementById('submissionsModal').style.display = 'none';
        };
    }

    // Close on click outside
    window.onclick = function (event) {
        const modal = document.getElementById('submissionsModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

window.viewSubmissions = function (assignmentId, title) {
    const modal = document.getElementById('submissionsModal');
    const titleEl = document.getElementById('modalTitle');
    const content = document.getElementById('submissionsContent');
    const submissions = db.getSubmissions().filter(s => s.assignmentId === assignmentId);
    const users = db.getUsers();

    titleEl.textContent = `Submissions: ${title}`;
    modal.style.display = 'flex';

    if (submissions.length === 0) {
        content.innerHTML = '<p class="text-muted" style="text-align: center; padding: 2rem;">No submissions yet.</p>';
        return;
    }

    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Date</th>
                    <th>Grade</th>
                    <th>Score</th>
                    <th>Uploads</th>
                </tr>
            </thead>
            <tbody>
    `;

    submissions.forEach(sub => {
        const student = users.find(u => u.id === sub.studentId);
        const studentName = student ? student.name : 'Unknown Student';
        const date = new Date(sub.submittedAt).toLocaleDateString();
        const score = sub.aiResult ? sub.aiResult.totalMarks : '-';
        const grade = sub.aiResult ? sub.aiResult.grade : '-';

        let fileLink = '<span class="text-muted">-</span>';
        if (sub.solutionFile) {
            fileLink = `<a href="#" onclick="alert('Viewing file: ${sub.solutionFile}'); return false;">${sub.solutionFile}</a>`;
        }

        html += `
            <tr>
                <td style="font-weight: 500;">${studentName}</td>
                <td>${date}</td>
                <td><span class="badge badge-${grade === 'A' || grade === 'B' ? 'green' : 'yellow'}">${grade}</span></td>
                <td>${score}/100</td>
                <td>${fileLink}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    content.innerHTML = html;
}

function setupCreateAssignment() {
    const questionsContainer = document.getElementById('questionsContainer');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    let questionCount = 0;

    // Add Question Handler
    addQuestionBtn.addEventListener('click', () => {
        questionCount++;
        const qDiv = document.createElement('div');
        qDiv.className = 'question-container';
        qDiv.id = `q_block_${questionCount}`;
        qDiv.innerHTML = `
             <div class="remove-question-btn" onclick="removeQuestion(${questionCount})">Remove</div>
             <div class="form-group">
                <label class="form-label">Question Text</label>
                <textarea class="form-control question-text" required placeholder="Enter question..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Marks</label>
                <input type="number" class="form-control question-marks" required min="1" placeholder="10">
            </div>
        `;
        questionsContainer.appendChild(qDiv);
    });

    // Initial Question
    addQuestionBtn.click();

    // Form Submission
    const form = document.getElementById('createAssignmentForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('asgTitle').value;
        const subject = document.getElementById('asgSubject').value;
        const description = document.getElementById('asgDesc').value;
        const deadline = document.getElementById('asgDeadline').value;

        // Gather Questions
        const qElements = document.querySelectorAll('.question-container');
        const questions = [];

        qElements.forEach((el, index) => {
            const text = el.querySelector('.question-text').value;
            const marks = el.querySelector('.question-marks').value;
            questions.push({
                id: `q_${Date.now()}_${index}`,
                text,
                marks: parseInt(marks)
            });
        });

        if (questions.length === 0) {
            alert('Please add at least one question.');
            return;
        }

        const pdfInput = document.getElementById('asgPdf');
        const pdfFile = pdfInput.files[0] ? pdfInput.files[0].name : null;

        const newAssignment = {
            title,
            subject, // Save Subject
            description,
            deadline,
            pdfFile, // Store filename (mock upload)
            questions
        };

        db.saveAssignment(newAssignment);
        alert('Assignment published successfully!');
        window.location.href = 'faculty-dashboard.html';
    });
}

// Global scope for onclick handler
window.removeQuestion = function (id) {
    const el = document.getElementById(`q_block_${id}`);
    if (el) el.remove();
}
