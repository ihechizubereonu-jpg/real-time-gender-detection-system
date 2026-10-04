/* =========================================================
   GENDER DETECTION MODULE
   Real-Time Gender Detection System
   
   Uses:
   - face-api.js
   - TinyFaceDetector
   - Pre-trained Age/Gender Model
   
   IMPORTANT:
   This module does NOT generate random predictions.
   Gender and probability come directly from the
   pre-trained face-api.js ageGenderNet model.
========================================================= */

/* =========================================================
   CONFIGURATION
========================================================= */
const AGE_GENDER_MODEL_URL = "./models/age_gender";

/* =========================================================
   MODEL STATE
========================================================= */
let genderModelLoaded = false;

/* =========================================================
   LOAD AGE/GENDER MODEL
========================================================= */
/**
 * Loads the pre-trained age/gender model.
 * 
 * @returns {Promise<boolean>}
 */
async function loadGenderModel() {
    try {
        if (typeof faceapi === "undefined") {
            throw new Error("face-api.js has not been loaded.");
        }

        if (genderModelLoaded) {
            return true;
        }

        console.log("Loading pre-trained age/gender model...");

        await faceapi.nets.ageGenderNet.loadFromUri(AGE_GENDER_MODEL_URL);

        genderModelLoaded = true;

        console.log("Age/gender model loaded successfully.");
        return true;
    } catch (error) {
        genderModelLoaded = false;
        console.error("Failed to load age/gender model:", error);
        throw new Error(
            "The age/gender AI model could not be loaded. " +
            "Check that the model files are correctly placed inside models/age_gender/."
        );
    }
}

/* =========================================================
   CHECK MODEL STATUS
========================================================= */
function isGenderModelLoaded() {
    return genderModelLoaded;
}

/* =========================================================
   CLASSIFY GENDER
========================================================= */
/**
 * Detects faces and performs age/gender classification.
 * 
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} input
 * @returns {Promise<Object>}
 */
async function classifyGender(input) {
    try {
        if (!input) {
            return {
                success: false,
                reason: "INVALID_INPUT",
                faceCount: 0,
                message: "No image or video input was provided."
            };
        }

        if (!genderModelLoaded) {
            await loadGenderModel();
        }

        if (typeof FaceDetection === "undefined") {
            throw new Error("FaceDetection module is not available.");
        }

        console.log("Starting face detection and gender classification...");

        /* ---------------------------------------------
           Detect ALL faces and extract age/gender
        --------------------------------------------- */
        const detections = await faceapi
            .detectAllFaces(input, FaceDetection.FACE_DETECTOR_OPTIONS)
            .withAgeAndGender();

        const faceCount = detections.length;
        console.log("Total faces detected by AI:", faceCount);

        /* =================================================
           CASE 1: NO FACE
        ================================================= */
        if (faceCount === 0) {
            return {
                success: false,
                reason: "NO_FACE",
                faceCount: 0,
                message: "No face was detected. Please provide a clear image containing one visible face."
            };
        }

        /* =================================================
           CASE 2: MULTIPLE FACES
        ================================================= */
        if (faceCount > 1) {
            return {
                success: false,
                reason: "MULTIPLE_FACES",
                faceCount: faceCount,
                message: `Multiple faces detected (${faceCount}). Only one face is allowed at a time.`
            };
        }

        /* =================================================
           CASE 3: EXACTLY ONE FACE (SUCCESS)
        ================================================= */
        const detection = detections[0];

        // Extract raw data from the neural network
        const rawGender = detection.gender; 
        const rawProbability = detection.genderProbability; 
        const rawAge = detection.age;

        // Log the raw AI output for debugging/academic proof
        console.log("Raw AI Output -> Gender:", rawGender, "| Probability:", rawProbability, "| Age:", rawAge);

        /* ---------------------------------------------
           Format and return the final result
        --------------------------------------------- */
        return {
            success: true,
            reason: "ONE_FACE",
            faceCount: 1,
            // Force lowercase to prevent UI case-sensitivity bugs
            gender: String(rawGender).toLowerCase(), 
            // Convert 0.91 to 91.00
            genderProbability: Number((rawProbability * 100).toFixed(2)),
            // Round age to 1 decimal place
            age: Number(rawAge.toFixed(1)),
            detection: detection
        };

    } catch (error) {
        console.error("Gender classification error:", error);
        return {
            success: false,
            reason: "CLASSIFICATION_ERROR",
            faceCount: 0,
            message: error.message || "An error occurred while analyzing the face."
        };
    }
}

/* =========================================================
   CLASSIFY DETECTED FACE
========================================================= */
async function classifyDetectedFace(input) {
    // Reuse the main classifyGender function to avoid code duplication
    return await classifyGender(input);
}

/* =========================================================
   FORMAT GENDER
========================================================= */
/**
 * Converts the model's gender value into a display-friendly value.
 * 
 * @param {string} gender
 * @returns {string}
 */
function formatGender(gender) {
    if (!gender) {
        return "Unknown";
    }

    const normalizedGender = String(gender).toLowerCase();

    if (normalizedGender === "male") {
        return "Male";
    }

    if (normalizedGender === "female") {
        return "Female";
    }

    return "Unknown";
}

/* =========================================================
   GET GENDER ICON
========================================================= */
/**
 * Returns a simple display symbol for the detected gender.
 * 
 * @param {string} gender
 * @returns {string}
 */
function getGenderIcon(gender) {
    if (!gender) {
        return "?";
    }

    const normalizedGender = String(gender).toLowerCase();

    if (normalizedGender === "male") {
        return "♂";
    }

    if (normalizedGender === "female") {
        return "♀";
    }

    return "?";
}

/* =========================================================
   VALIDATE CLASSIFICATION RESULT
========================================================= */
/**
 * Performs a final sanity check on the model output.
 * 
 * @param {Object} result
 * @returns {Object}
 */
function validateClassificationResult(result) {
    if (!result) {
        return { valid: false, reason: "EMPTY_RESULT" };
    }

    if (!result.success) {
        return {
            valid: false,
            reason: result.reason || "UNKNOWN_ERROR",
            message: result.message || "Classification was unsuccessful."
        };
    }

    if (result.faceCount !== 1) {
        return {
            valid: false,
            reason: "INVALID_FACE_COUNT",
            message: "The system requires exactly one face."
        };
    }

    if (result.gender !== "male" && result.gender !== "female") {
        return {
            valid: false,
            reason: "INVALID_GENDER",
            message: "The AI model returned an unrecognized gender value."
        };
    }

    if (typeof result.genderProbability !== "number") {
        return {
            valid: false,
            reason: "INVALID_PROBABILITY",
            message: "The AI model did not return a valid probability."
        };
    }

    if (result.genderProbability < 0 || result.genderProbability > 100) {
        return {
            valid: false,
            reason: "INVALID_PROBABILITY_RANGE",
            message: "The model probability is outside the expected range."
        };
    }

    return { valid: true, reason: "VALID" };
}

/* =========================================================
   EXPORT MODULE
========================================================= */
window.GenderDetection = {
    loadGenderModel,
    isGenderModelLoaded,
    classifyGender,
    classifyDetectedFace,
    formatGender,
    getGenderIcon,
    validateClassificationResult,
    AGE_GENDER_MODEL_URL
};