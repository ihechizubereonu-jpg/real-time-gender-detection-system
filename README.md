# Real-Time Gender Detection System

An intelligent computer vision system that detects human faces and estimates gender using a pre-trained machine learning model. Built with face-api.js and TensorFlow.js for browser-based, privacy-preserving AI inference.

---

## 🎯 Project Overview

This system demonstrates real-time gender detection using artificial intelligence and computer vision. It processes facial images through a controlled pipeline that includes face detection, validation, and classification—all running directly in the browser without requiring a backend server or database.

### Key Features

- **Real AI Model**: Uses pre-trained neural networks (TinyFaceDetector + ageGenderNet) from face-api.js
- **Single-Face Validation**: Rejects images with zero or multiple faces to ensure reliable analysis
- **Dual Input Methods**: Upload images or use live webcam feed
- **Privacy-Preserving**: All processing happens locally in the browser—no data is sent to external servers
- **Modern UI/UX**: Responsive design with real-time feedback and visual indicators
- **Browser-Based**: No installation required—runs on any modern web browser

---

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid, Flexbox, and custom properties
- **Vanilla JavaScript**: Modular, well-structured code without frameworks

### AI & Computer Vision
- **face-api.js**: Face detection and recognition library
- **TensorFlow.js**: Machine learning framework for browser-based inference
- **Pre-trained Models**: 
  - TinyFaceDetector (face detection)
  - ageGenderNet (gender classification and age estimation)

### Development Tools
- No build tools required (pure HTML/CSS/JS)
- Compatible with any modern code editor (VS Code, Sublime, etc.)

---

## 📁 Project Structure
