/**
 * AI Assignment Grading System - Mock Data Layer
 * Handles data persistence using localStorage
 */

const STORAGE_KEYS = {
    ASSIGNMENTS: 'grading_sys_assignments',
    SUBMISSIONS: 'grading_sys_submissions',
    USERS: 'grading_sys_users',
    CURRENT_USER: 'grading_sys_current_user'
};

// Seed Data
const seedData = {
    assignments: [
        {
            id: 'asg_1',
            title: 'Intro to Artificial Intelligence',
            description: 'Basic concepts of AI, ML, and DL.',
            deadline: '2025-12-31',
            questions: [
                { id: 'q1', text: 'Define Artificial Intelligence.', marks: 10 },
                { id: 'q2', text: 'Explain the difference between Supervised and Unsupervised learning.', marks: 15 }
            ],
            createdAt: new Date().toISOString()
        }
    ],
    submissions: [], // Format: { id, assignmentId, studentId, answers: [], aiResult: {}, submittedAt }
    users: [
        { id: 'u1', username: 'faculty', password: 'password', role: 'faculty', name: 'Dr. Smith' },
        { id: 'u2', username: 'student', password: 'password', role: 'student', name: 'John Doe' }
    ]
};

// Data Store Class
class DataStore {
    constructor() {
        this.initialize();
    }

    initialize() {
        if (!localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS)) {
            localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(seedData.assignments));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
            localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(seedData.submissions));
        }
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedData.users));
        }
    }

    // --- User Methods ---
    getUsers() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    }

    login(username, password, role) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username && u.password === password && u.role === role);
        if (user) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid credentials or role.' };
    }

    registerUser(name, username, password, role) {
        const users = this.getUsers();
        if (users.find(u => u.username === username)) {
            return { success: false, message: 'Username already exists.' };
        }

        const newUser = {
            id: 'u_' + Date.now(),
            name,
            username,
            password,
            role
        };

        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return { success: true, user: newUser };
    }

    logout() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        window.location.href = '../login.html';
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
    }

    requireAuth(allowedRole = null) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = '../login.html';
            return;
        }
        if (allowedRole && user.role !== allowedRole) {
            alert('Unauthorized access');
            window.location.href = user.role === 'faculty' ? '../faculty/faculty-dashboard.html' : '../student/student-dashboard.html';
        }
        return user;
    }

    // --- Assignment Methods ---
    getAssignments() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS) || '[]');
    }

    saveAssignment(assignment) {
        const assignments = this.getAssignments();
        assignment.id = 'asg_' + Date.now();
        assignment.createdAt = new Date().toISOString();
        assignments.unshift(assignment); // Add to beginning
        localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
        return assignment;
    }

    getAssignmentById(id) {
        const assignments = this.getAssignments();
        return assignments.find(a => a.id === id);
    }

    // --- Submission Methods ---
    getSubmissions() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) || '[]');
    }

    saveSubmission(submission) {
        const submissions = this.getSubmissions();
        submission.id = 'sub_' + Date.now();
        submission.submittedAt = new Date().toISOString();

        // Mock AI Evaluation
        submission.aiResult = this.mockAiEvaluation(submission.answers);

        submissions.push(submission);
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
        return submission;
    }

    getStudentSubmissions(studentId) {
        const submissions = this.getSubmissions();
        return submissions.filter(s => s.studentId === studentId);
    }

    // Mock AI Logic
    mockAiEvaluation(answers) {
        // Randomize score slightly for "realism"
        const baseScore = 80 + Math.floor(Math.random() * 15); // 80-95 range
        const plagiarism = Math.floor(Math.random() * 10); // 0-10% range

        let grade = 'A';
        if (baseScore < 90) grade = 'B';
        if (baseScore < 80) grade = 'C';
        if (baseScore < 70) grade = 'D';
        if (baseScore < 60) grade = 'F';

        return {
            totalMarks: baseScore,
            grade: grade,
            plagiarismPercentage: plagiarism,
            feedback: "Good attempt! The definitions are accurate, but some examples could be more specific. Key AI concepts are covered well."
        };
    }
}

// Global instance
const db = new DataStore();
