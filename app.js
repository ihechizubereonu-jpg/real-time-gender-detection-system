/* =========================================================
   MAIN APPLICATION CONTROLLER
   Real-Time Gender Detection System

   This file coordinates the entire application:
   - Loads AI models on startup
   - Manages tab switching (Upload / Webcam)
   - Initializes the hero image slider
   - Wires up all event listeners
   - Handles global UI interactions
========================================================= */

/* =========================================================
   APPLICATION STATE
========================================================= */
const ApplicationState = {
    modelsLoaded: false,
    currentMode: "upload"
};

/* =========================================================
   DOM ELEMENTS
========================================================= */
let uploadTab, webcamTab, uploadPanel, webcamPanel;
let heroUploadButton, heroWebcamButton, newAnalysisButton, closeMessageButton;

/* =========================================================
   INITIALIZE APPLICATION
========================================================= */
async function initializeApplication() {
    try {
        console.log("Starting Real-Time Gender Detection System...");
        
        /* ---------------------------------------------
           Check that face-api.js loaded
        --------------------------------------------- */
        if (typeof faceapi === "undefined") {
            throw new Error("The face-api.js library has not loaded. Check your internet connection or script reference.");
        }

        /* ---------------------------------------------
           Load face detection model
        --------------------------------------------- */
        UIManager.updateLoaderMessage("Loading face detection model...");
        await FaceDetection.loadFaceDetectionModel();

        /* ---------------------------------------------
           Load gender classification model
        --------------------------------------------- */
        UIManager.updateLoaderMessage("Loading gender recognition model...");
        await GenderDetection.loadGenderModel();

        /* ---------------------------------------------
           Mark models as loaded
        --------------------------------------------- */
        ApplicationState.modelsLoaded = true;

        /* ---------------------------------------------
           Update system status
        --------------------------------------------- */
        UIManager.updateSystemStatus("AI System Ready", "ready");

        /* ---------------------------------------------
           Show the main application (small delay for smooth transition)
        --------------------------------------------- */
        setTimeout(() => {
            UIManager.showApplication();
        }, 500);

        /* ---------------------------------------------
           Initialize all modules and event listeners
        --------------------------------------------- */
        initializeApplicationModules();
        setupEventListeners();
        initializeHeroSlider(); // Initialize the 7-image auto-slider

        console.log("Application initialized successfully.");
    } catch (error) {
        console.error("Initialization error:", error);
        UIManager.updateLoaderMessage(getInitializationErrorMessage(error));
        UIManager.updateSystemStatus("System Error", "error");
        
        setTimeout(() => {
            UIManager.showApplication();
            UIManager.showMessage("System Initialization Failed", getInitializationErrorMessage(error), "error");
        }, 700);
    }
}

/* =========================================================
   INITIALIZE MODULES
========================================================= */
function initializeApplicationModules() {
    ImageHandler.initializeImageHandler();
    WebcamManager.initializeWebcam();
}

/* =========================================================
   SETUP EVENT LISTENERS
========================================================= */
function setupEventListeners() {
    // Cache DOM elements safely
    uploadTab = document.getElementById("uploadTab");
    webcamTab = document.getElementById("webcamTab");
    uploadPanel = document.getElementById("uploadPanel");
    webcamPanel = document.getElementById("webcamPanel");
    heroUploadButton = document.getElementById("heroUploadButton");
    heroWebcamButton = document.getElementById("heroWebcamButton");
    newAnalysisButton = document.getElementById("newAnalysisButton");
    closeMessageButton = document.getElementById("closeMessageButton");

    /* ---------------------------------------------
       Tab switching
    --------------------------------------------- */
    if (uploadTab) {
        uploadTab.addEventListener("click", () => switchMode("upload"));
    }
    if (webcamTab) {
        webcamTab.addEventListener("click", () => switchMode("webcam"));
    }

    /* ---------------------------------------------
       Hero buttons
    --------------------------------------------- */
    if (heroUploadButton) {
        heroUploadButton.addEventListener("click", () => {
            switchMode("upload");
            scrollToDetector();
            setTimeout(() => {
                const input = document.getElementById("imageInput");
                if (input) input.click();
            }, 500);
        });
    }
    if (heroWebcamButton) {
        heroWebcamButton.addEventListener("click", () => {
            switchMode("webcam");
            scrollToDetector();
            setTimeout(() => WebcamManager.startCamera(), 500);
        });
    }

    /* ---------------------------------------------
       New analysis button
    --------------------------------------------- */
    if (newAnalysisButton) {
        newAnalysisButton.addEventListener("click", performNewAnalysis);
    }

    /* ---------------------------------------------
       Close message button
    --------------------------------------------- */
    if (closeMessageButton) {
        closeMessageButton.addEventListener("click", () => UIManager.hideMessage());
    }
}

/* =========================================================
   SWITCH MODE (UPLOAD / WEBCAM)
========================================================= */
function switchMode(mode) {
    ApplicationState.currentMode = mode;
    UIManager.hideMessage();
    UIManager.hideProcessing();

    /* ---------------------------------------------
       Update tab styles and panels
    --------------------------------------------- */
    if (mode === "upload") {
        if (uploadTab) uploadTab.classList.add("active");
        if (webcamTab) webcamTab.classList.remove("active");
        if (uploadPanel) uploadPanel.classList.add("active-panel");
        if (webcamPanel) webcamPanel.classList.remove("active-panel");
        
        // Stop camera if switching away from webcam to save resources
        WebcamManager.stopCamera();
    } else {
        if (webcamTab) webcamTab.classList.add("active");
        if (uploadTab) uploadTab.classList.remove("active");
        if (webcamPanel) webcamPanel.classList.add("active-panel");
        if (uploadPanel) uploadPanel.classList.remove("active-panel");
    }
    
    UIManager.hideResults();
}

/* =========================================================
   SCROLL TO DETECTOR
========================================================= */
function scrollToDetector() {
    const detectorSection = document.getElementById("detector");
    if (detectorSection) {
        detectorSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

/* =========================================================
   PERFORM NEW ANALYSIS
========================================================= */
function performNewAnalysis() {
    UIManager.resetResults();
    UIManager.hideMessage();
    UIManager.hideProcessing();

    if (ApplicationState.currentMode === "upload") {
        ImageHandler.clearSelectedImage();
    } else {
        WebcamManager.stopCamera();
    }

    scrollToDetector();
}

/* =========================================================
   INITIALIZATION ERROR MESSAGE
========================================================= */
function getInitializationErrorMessage(error) {
    if (!error) return "The AI system could not be initialized.";
    const message = error.message || "";
    
    if (message.includes("model") || message.includes("fetch")) {
        return "The AI model files could not be loaded. Please confirm that the model files are present in the correct models/ folders and that the application is being opened through a local web server.";
    }
    
    return message || "The AI system could not be initialized. Check the model files and try again.";
}

/* =========================================================
   PROFESSIONAL IMAGE SLIDER LOGIC
========================================================= */
function initializeHeroSlider() {
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.querySelector('.slider-dots');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const progressBar = document.querySelector('.slider-progress');
    const sliderContainer = document.querySelector('.hero-slider');
    
    if (slides.length === 0) return;

    let currentSlide = 0;
    let slideInterval;
    const SLIDE_DURATION = 5000; // 5 seconds

    // Create dots dynamically
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');

    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        
        currentSlide = (index + slides.length) % slides.length;
        
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
        
        resetInterval();
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }

    function startInterval() {
        progressBar.style.transition = 'none';
        progressBar.style.width = '0%';
        
        setTimeout(() => {
            progressBar.style.transition = `width ${SLIDE_DURATION}ms linear`;
            progressBar.style.width = '100%';
        }, 50);

        slideInterval = setInterval(nextSlide, SLIDE_DURATION);
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }

    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); });

    // Pause on hover for better UX
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
            progressBar.style.transition = 'none';
        });

        sliderContainer.addEventListener('mouseleave', () => {
            startInterval();
        });
    }

    // Initialize
    startInterval();
}

/* =========================================================
   START APPLICATION ON PAGE LOAD
========================================================= */
window.addEventListener("load", function () {
    initializeApplication();
});