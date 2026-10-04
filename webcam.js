/* =========================================================
   WEBCAM MODULE (OPTIMIZED FOR SPEED)
========================================================= */
let webcamVideo;
let webcamCanvas;
let startCameraButton;
let captureButton;
let stopCameraButton;
let cameraStream = null;

/* =========================================================
   INITIALIZE
========================================================= */
function initializeWebcam() {
    webcamVideo = document.getElementById("webcamVideo");
    webcamCanvas = document.getElementById("webcamCanvas");
    startCameraButton = document.getElementById("startCameraButton");
    captureButton = document.getElementById("captureButton");
    stopCameraButton = document.getElementById("stopCameraButton");

    if (startCameraButton) startCameraButton.addEventListener("click", startCamera);
    if (captureButton) captureButton.addEventListener("click", captureAndAnalyze);
    if (stopCameraButton) stopCameraButton.addEventListener("click", stopCamera);
}

/* =========================================================
   START CAMERA
========================================================= */
async function startCamera() {
    try {
        UIManager.hideMessage();
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Your browser does not support webcam access.");
        }
        if (cameraStream) stopCamera();

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });

        webcamVideo.srcObject = cameraStream;
        await webcamVideo.play();

        UIManager.updateCameraStatus(true);
        UIManager.updateWebcamMessage("Camera Ready", "Position one face inside the frame.");

        startCameraButton.disabled = true;
        captureButton.disabled = false;
        stopCameraButton.disabled = false;
        console.log("Camera started successfully.");
    } catch (error) {
        console.error("Camera error:", error);
        UIManager.showMessage("Camera Error", getCameraErrorMessage(error), "error");
    }
}

/* =========================================================
   CAPTURE FRAME (OPTIMIZED: SINGLE PASS)
========================================================= */
async function captureAndAnalyze() {
    if (!cameraStream) {
        UIManager.showMessage("Camera Not Active", "Please start the camera first.", "warning");
        return;
    }

    try {
        UIManager.showProcessing();
        UIManager.hideResults();

        /* --------------------------------------------
           1. Capture the frame to canvas
        -------------------------------------------- */
        const width = webcamVideo.videoWidth;
        const height = webcamVideo.videoHeight;
        if (!width || !height) {
            throw new Error("The camera video is not ready yet.");
        }

        webcamCanvas.width = width;
        webcamCanvas.height = height;
        const context = webcamCanvas.getContext("2d");

        context.save();
        context.translate(width, 0);
        context.scale(-1, 1);
        context.drawImage(webcamVideo, 0, 0, width, height);
        context.restore();

        /* --------------------------------------------
           2. Run AI Classification (Handles validation internally)
           FIX: We removed the separate validateSingleFace() call.
           classifyGender() already checks for 0 or 2+ faces, 
           so running it twice was causing the delay.
        -------------------------------------------- */
        const result = await GenderDetection.classifyGender(webcamCanvas);
        
        UIManager.hideProcessing();

        /* --------------------------------------------
           3. Handle Rejections (0 faces or 2+ faces)
        -------------------------------------------- */
        if (!result.success) {
            UIManager.showMessage(
                result.reason === "MULTIPLE_FACES" ? "Multiple Faces Detected" : "No Face Detected",
                result.message,
                result.reason === "MULTIPLE_FACES" ? "error" : "warning"
            );
            return;
        }

        /* --------------------------------------------
           4. Display Result
        -------------------------------------------- */
        const imageData = webcamCanvas.toDataURL("image/jpeg", 0.92);
        
        UIManager.setResultImage(imageData);
        UIManager.displayResult(result);
        
        UIManager.showMessage(
            "Analysis Complete",
            `Successfully detected: ${GenderDetection.formatGender(result.gender)} (${result.genderProbability}% confidence)`,
            "success"
        );

        const newAnalysisButton = document.getElementById("newAnalysisButton");
        if (newAnalysisButton) newAnalysisButton.classList.remove("hidden");

    } catch (error) {
        console.error("Webcam analysis error:", error);
        UIManager.hideProcessing();
        UIManager.showMessage("Camera Analysis Error", error.message || "Unable to analyze the camera frame.", "error");
    }
}

/* =========================================================
   STOP CAMERA
========================================================= */
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    if (webcamVideo) webcamVideo.srcObject = null;
    
    UIManager.updateCameraStatus(false);
    UIManager.updateWebcamMessage("Camera is not active", "Start your camera to begin detection.");
    
    if (startCameraButton) startCameraButton.disabled = false;
    if (captureButton) captureButton.disabled = true;
    if (stopCameraButton) stopCameraButton.disabled = true;
}

/* =========================================================
   CAMERA ERROR MESSAGE
========================================================= */
function getCameraErrorMessage(error) {
    if (!error) return "Unable to access the camera.";
    if (error.name === "NotAllowedError") return "Camera permission was denied. Allow camera access in your browser and try again.";
    if (error.name === "NotFoundError") return "No camera was found on this device.";
    if (error.name === "NotReadableError") return "The camera may already be in use by another application.";
    if (error.name === "SecurityError") return "Camera access was blocked for security reasons.";
    return error.message || "Unable to access the camera.";
}

/* =========================================================
   CLEANUP
========================================================= */
window.addEventListener("beforeunload", () => { stopCamera(); });

/* =========================================================
   EXPORT
========================================================= */
window.WebcamManager = { initializeWebcam, startCamera, captureAndAnalyze, stopCamera };