document.addEventListener('DOMContentLoaded', () => {
    // Ensure user is student
    const user = db.requireAuth('student');
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

    // Router-ish logic based on page presence
    if (document.getElementById('studentDashboard')) {
        renderStudentDashboard(user.id);
    }

    if (document.getElementById('viewAssignmentsList')) {
        renderAllAssignments(user.id);
    }

    if (document.getElementById('submissionForm')) {
        setupSubmissionForm(user.id);
    }

    if (document.getElementById('aiResultContainer')) {
        renderAiResult();
    }
});

/**
 * Render Student Dashboard
 * Shows pending and completed counts, and recent pending assignments.
 */
function renderStudentDashboard(studentId) {
    const allAssignments = db.getAssignments();
    const mySubmissions = db.getStudentSubmissions(studentId);

    const submittedIds = new Set(mySubmissions.map(s => s.assignmentId));
    const pending = allAssignments.filter(a => !submittedIds.has(a.id));
    const completed = allAssignments.filter(a => submittedIds.has(a.id));

    // Stats
    document.getElementById('pendingCount').textContent = pending.length;
    document.getElementById('completedCount').textContent = completed.length;

    // Pending List
    const listContainer = document.getElementById('pendingList');
    listContainer.innerHTML = '';

    if (pending.length === 0) {
        listContainer.innerHTML = '<p>No pending assignments. Great job!</p>';
    } else {
        pending.slice(0, 3).forEach(asg => {
            const el = document.createElement('div');
            el.className = 'assignment-item';
            el.innerHTML = `
                <div class="assignment-info">
                    <h3>${asg.title}</h3>
                    <p class="summary">${asg.description}</p>
                    <div class="assignment-meta">Due: ${asg.deadline}</div>
                </div>
                <a href="submit-assignment.html?id=${asg.id}" class="btn btn-primary">Start</a>
            `;
            listContainer.appendChild(el);
        });
    }
}

/**
 * Render All Assignments List (View Assignments Page)
 */
function renderAllAssignments(studentId) {
    const listContainer = document.getElementById('viewAssignmentsList');
    const allAssignments = db.getAssignments();
    const mySubmissions = db.getStudentSubmissions(studentId);
    const submittedIds = new Set(mySubmissions.map(s => s.assignmentId));

    if (allAssignments.length === 0) {
        listContainer.innerHTML = '<p>No assignments available.</p>';
        return;
    }

    allAssignments.forEach(asg => {
        const isSubmitted = submittedIds.has(asg.id);
        const actionBtn = isSubmitted
            ? `<a href="ai-result.html?submissionId=${mySubmissions.find(s => s.assignmentId === asg.id).id}" class="btn btn-secondary">View Result</a>`
            : `<a href="submit-assignment.html?id=${asg.id}" class="btn btn-primary">Start Assignment</a>`;

        const badge = isSubmitted
            ? `<span class="badge badge-green">Submitted</span>`
            : `<span class="badge badge-yellow">Pending</span>`;

        const el = document.createElement('div');
        el.className = 'assignment-item';
        el.innerHTML = `
             <div class="assignment-info">
                <h3>${asg.title} ${badge}</h3>
                <p>${asg.description}</p>
                <div class="assignment-meta">Due: ${asg.deadline} • Questions: ${asg.questions.length}</div>
            </div>
            <div>${actionBtn}</div>
        `;
        listContainer.appendChild(el);
    });
}

/**
 * Setup Submission Form
 */
function setupSubmissionForm(studentId) {
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = urlParams.get('id');

    if (!assignmentId) {
        alert('No assignment specified.');
        window.location.href = 'student-dashboard.html';
        return;
    }

    const assignment = db.getAssignmentById(assignmentId);
    if (!assignment) {
        alert('Assignment not found.');
        window.location.href = 'student-dashboard.html';
        return;
    }

    // Render Page Header
    document.getElementById('asgTitle').textContent = assignment.title;
    document.getElementById('asgDesc').textContent = assignment.description;

    // Render PDF Link
    if (assignment.pdfFile) {
        const pdfContainer = document.getElementById('pdfContainer');
        const pdfLink = document.getElementById('pdfLink');
        if (pdfContainer && pdfLink) {
            pdfContainer.style.display = 'block';
            // In a real app, this would be a real URL. For mock, we just use a placeholder or data URI if we had one.
            // Since we only stored the name, we'll just make it look like a link.
            pdfLink.href = '#';
            pdfLink.onclick = (e) => {
                e.preventDefault();
                alert(`Opening mocked PDF: ${assignment.pdfFile}`);
            };
            pdfLink.innerHTML = `📄 View PDF: ${assignment.pdfFile}`;
        }
    }

    // Render Questions
    const questionsContainer = document.getElementById('questionsWrapper');
    assignment.questions.forEach((q, index) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'question-container';
        qDiv.dataset.id = q.id;
        qDiv.innerHTML = `
            <div style="margin-bottom: 0.5rem; font-weight: 600;">Question ${index + 1} (${q.marks} marks)</div>
            <p style="margin-bottom: 1rem;">${q.text}</p>
            <textarea class="form-control answer-input" rows="4" placeholder="Type your answer here..."></textarea>
        `;
        questionsContainer.appendChild(qDiv);
    });

    // Handle Submit
    document.getElementById('submissionForm').addEventListener('submit', (e) => {
        e.preventDefault();

        if (!confirm('Are you sure you want to submit? This cannot be undone.')) return;

        const answers = [];
        const questionDivs = document.querySelectorAll('.question-container');

        questionDivs.forEach(div => {
            answers.push({
                questionId: div.dataset.id,
                answerText: div.querySelector('.answer-input').value
            });
        });

        // Capture uploaded solution file
        const fileInput = document.getElementById('solutionFile');
        const solutionFile = fileInput && fileInput.files[0] ? fileInput.files[0].name : null;

        const submission = {
            assignmentId: assignment.id,
            studentId: studentId,
            answers: answers,
            solutionFile: solutionFile // Store filename
        };

        const result = db.saveSubmission(submission);
        window.location.href = `ai-result.html?submissionId=${result.id}`;
    });
}

/**
 * Render AI Result Page
 */
function renderAiResult() {
    const urlParams = new URLSearchParams(window.location.search);
    const submissionId = urlParams.get('submissionId');
    const submissions = db.getSubmissions();
    const submission = submissions.find(s => s.id === submissionId);

    if (!submission) {
        document.getElementById('aiResultContainer').innerHTML = '<p>Result not found.</p>';
        return;
    }

    const assignment = db.getAssignmentById(submission.assignmentId);
    if (assignment) {
        document.getElementById('asgTitle').textContent = assignment.title;
    }

    // Display Result Data
    const result = submission.aiResult;
    document.getElementById('scoreDisplay').textContent = `${result.totalMarks}/100`;
    document.getElementById('gradeDisplay').textContent = result.grade;
    document.getElementById('plagiarismDisplay').textContent = `${result.plagiarismPercentage}%`;
    document.getElementById('feedbackDisplay').textContent = result.feedback;

    // Color code grade
    const circle = document.querySelector('.grade-circle');
    if (result.grade === 'A') circle.style.background = 'linear-gradient(135deg, #10b981, #059669)'; // Green
    else if (result.grade === 'B') circle.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)'; // Blue
    else if (result.grade === 'C') circle.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)'; // Yellow
    else circle.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)'; // Red
}
