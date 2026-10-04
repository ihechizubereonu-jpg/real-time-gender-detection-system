/* =========================================================
   FACE DETECTION MODULE
   Real-Time Gender Detection System
   
   RESPONSIBILITIES:
   - Load the Tiny Face Detector model
   - Detect ALL faces in an image/video
   - Validate face count (reject 0 or 2+ faces)
   - Provide face detection utilities
   
   IMPORTANT:
   This module uses detectAllFaces() to ensure we can
   reject images with multiple faces, not just detect
   a single face.
========================================================= */

/* =========================================================
   CONFIGURATION
========================================================= */
const FACE_MODEL_URL = "./models/tiny_face_detector";

const FACE_DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.5
});

let faceDetectionModelLoaded = false;

/* =========================================================
   LOAD FACE DETECTION MODEL
========================================================= */
/**
 * Loads the Tiny Face Detector model.
 * 
 * The model files must exist inside:
 * models/tiny_face_detector/
 * 
 * @returns {Promise<boolean>}
 */
async function loadFaceDetectionModel() {
    try {
        /* --------------------------------------------
           Check if face-api.js is available
        -------------------------------------------- */
        if (typeof faceapi === "undefined") {
            throw new Error(
                "face-api.js is not available."
            );
        }

        /* --------------------------------------------
           Avoid loading the model more than once
        -------------------------------------------- */
        if (faceDetectionModelLoaded) {
            return true;
        }

        console.log("Loading Tiny Face Detector...");

        /* --------------------------------------------
           Load the model from local directory
        -------------------------------------------- */
        await faceapi.nets.tinyFaceDetector.loadFromUri(
            FACE_MODEL_URL
        );

        faceDetectionModelLoaded = true;

        console.log(
            "Tiny Face Detector loaded successfully."
        );

        return true;
    } catch (error) {
        console.error(
            "Face detection model error:",
            error
        );
        throw new Error(
            "Tiny Face Detector could not be loaded. " +
            "Check the models/tiny_face_detector folder."
        );
    }
}

/* =========================================================
   DETECT ALL FACES
========================================================= */
/**
 * Detects ALL faces in the input image/video.
 * 
 * IMPORTANT:
 * We use detectAllFaces() instead of detectSingleFace()
 * because the system must reject images containing
 * multiple faces.
 * 
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input
 * @returns {Promise<Array>}
 */
async function detectAllFaces(input) {
    /* --------------------------------------------
       Ensure model is loaded
    -------------------------------------------- */
    if (!faceDetectionModelLoaded) {
        await loadFaceDetectionModel();
    }

    /* --------------------------------------------
       Detect all faces
    -------------------------------------------- */
    return await faceapi.detectAllFaces(
        input,
        FACE_DETECTOR_OPTIONS
    );
}

/* =========================================================
   VALIDATE FACE COUNT
========================================================= */
/**
 * Validates the number of detected faces.
 * 
 * Rules:
 * - 0 faces: Invalid (no face detected)
 * - 1 face: Valid (proceed with classification)
 * - 2+ faces: Invalid (multiple faces detected)
 * 
 * @param {Array} detections
 * @returns {Object}
 */
function validateFaceCount(detections) {
    const count = detections ? detections.length : 0;

    /* --------------------------------------------
       CASE 1: No face detected
    -------------------------------------------- */
    if (count === 0) {
        return {
            valid: false,
            reason: "NO_FACE",
            count: 0,
            message:
                "No face was detected. Please use a clear image containing one visible face."
        };
    }

    /* --------------------------------------------
       CASE 2: Multiple faces detected
    -------------------------------------------- */
    if (count > 1) {
        return {
            valid: false,
            reason: "MULTIPLE_FACES",
            count: count,
            message:
                `Multiple faces detected (${count}). Only one face is allowed at a time.`
        };
    }

    /* --------------------------------------------
       CASE 3: Exactly one face (valid)
    -------------------------------------------- */
    return {
        valid: true,
        reason: "ONE_FACE",
        count: 1,
        message: "Exactly one face was detected."
    };
}

/* =========================================================
   GET FACE COUNT
========================================================= */
/**
 * Returns the number of faces detected in the input.
 * 
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input
 * @returns {Promise<number>}
 */
async function getFaceCount(input) {
    const detections = await detectAllFaces(input);
    return detections.length;
}

/* =========================================================
   VALIDATE SINGLE FACE
========================================================= */
/**
 * Detects faces and validates that exactly one face exists.
 * 
 * This is the main validation function used by other modules.
 * 
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input
 * @returns {Promise<Object>}
 */
async function validateSingleFace(input) {
    try {
        /* --------------------------------------------
           Detect all faces
        -------------------------------------------- */
        const detections = await detectAllFaces(input);

        /* --------------------------------------------
           Validate the count
        -------------------------------------------- */
        return validateFaceCount(detections);
    } catch (error) {
        console.error("Face validation error:", error);
        return {
            valid: false,
            reason: "DETECTION_ERROR",
            count: 0,
            message:
                "An error occurred while detecting the face."
        };
    }
}

/* =========================================================
   DRAW DETECTION BOXES
========================================================= */
/**
 * Draws bounding boxes around detected faces on a canvas.
 * 
 * This is useful for debugging or visualization.
 * 
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input
 * @param {Array} detections
 * @param {HTMLCanvasElement} canvas
 */
function drawFaceDetection(input, detections, canvas) {
    if (!canvas) {
        return;
    }

    /* --------------------------------------------
       Get display dimensions
    -------------------------------------------- */
    const displaySize = {
        width:
            input.videoWidth ||
            input.naturalWidth ||
            input.width,
        height:
            input.videoHeight ||
            input.naturalHeight ||
            input.height
    };

    /* --------------------------------------------
       Match canvas dimensions
    -------------------------------------------- */
    faceapi.matchDimensions(canvas, displaySize);

    /* --------------------------------------------
       Resize detections to match display
    -------------------------------------------- */
    const resizedDetections = faceapi.resizeResults(
        detections,
        displaySize
    );

    /* --------------------------------------------
       Clear canvas
    -------------------------------------------- */
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    /* --------------------------------------------
       Draw detection boxes
    -------------------------------------------- */
    faceapi.draw.drawDetections(canvas, resizedDetections);
}

/* =========================================================
   EXPORT MODULE
========================================================= */
window.FaceDetection = {
    loadFaceDetectionModel,
    detectAllFaces,
    validateFaceCount,
    validateSingleFace,
    getFaceCount,
    drawFaceDetection,
    FACE_DETECTOR_OPTIONS
};