🎓 Student Academic Performance Predictor

A smart, data-driven web application designed to predict student performance and provide personalized academic guidance.

📖 Overview

The Student Academic Performance Predictor is a client-side web application that helps students and educators forecast academic outcomes based on key performance indicators. By analyzing factors like attendance, previous marks, and behavioral engagement, the system generates a Comprehensive Performance Score (out of 10) and provides actionable advice to help students improve.

This project was developed as part of the B.Tech Computer Science (AI & DS) curriculum.

🌟 Key Features

📊 5-Factor Prediction Model: Calculates a score based on Attendance, Previous Marks, Consistency, Behavior, and Time Utilization.

🤖 Guidance Assistant: A built-in rule-based chatbot that provides instant tips on improving marks, placement strategy, and maintaining a healthy diet/study balance.

🔒 Privacy-First: All data (history and predictions) is stored locally in the browser's localStorage. No data is sent to a server.

📂 Local Document Preview: Securely preview documents and certificates within the browser without uploading them to the cloud.

🎨 Modern UI: A responsive, dark-themed interface built with CSS variables and glassmorphism effects.

📜 History Log: Keeps track of past predictions to monitor progress over time.

⚙️ How It Works

The system uses a weighted algorithm to calculate the final score out of 10. The inputs are normalized and weighted as follows:

Parameter

Weight Impact

Description

Attendance

High

Regularity and discipline in classes.

Previous Marks

High

Academic strength and subject understanding.

Academic Consistency

Medium

Consistency in performance across semesters.

Behavior

High

Attentiveness and contribution in class (converted to numeric scale).

Time Utilization

Medium

Efficiency in balancing academic and non-academic activities.

Scoring Logic:


$$\text{Final Score} = \frac{\sum (\text{Factor Value} \times \text{Weight})}{\text{Total Weights}}$$

🛠️ Tech Stack

Frontend: HTML5, CSS3 (Custom Properties, Flexbox/Grid)

Scripting: Vanilla JavaScript (ES6+)

Storage: Web LocalStorage API

Design: Responsive Custom CSS (Dark Mode)

🚀 How to Run

This is a static web application, meaning it requires no backend server or installation process.

Download the repository/files.

Locate the index.html file in the root folder.

Double-click index.html to open it in your preferred web browser (Chrome, Edge, Firefox, etc.).

👥 Team Members

Vishal Kumar Sharma (Reg: 2025/21079)

Pradhyuman Singh (Reg: 2025/20892)

Prabhat Singh Rajawat (Reg: 2025/20705)

Naveen Kumar (Reg: 2025/20407)

🔮 Future Scope

Cloud Integration: Moving from LocalStorage to a database (Firebase/MongoDB) for cross-device access.

Advanced AI: Implementing a Decision Tree or Regression model (Python