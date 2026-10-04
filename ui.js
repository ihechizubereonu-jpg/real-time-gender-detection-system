/* =========================================================
   UI MODULE
   Handles all user-interface updates
========================================================= */
const UI = {
    applicationLoader: document.getElementById("applicationLoader"),
    loaderMessage: document.getElementById("loaderMessage"),
    application: document.getElementById("application"),
    systemStatus: document.getElementById("systemStatus"),
    detectionMessage: document.getElementById("detectionMessage"),
    messageTitle: document.getElementById("messageTitle"),
    messageText: document.getElementById("messageText"),
    processingIndicator: document.getElementById("processingIndicator"),
    resultsSection: document.getElementById("resultsSection"),
    resultImage: document.getElementById("resultImage"),
    genderResult: document.getElementById("genderResult"),
    genderIcon: document.getElementById("genderIcon"),
    confidenceValue: document.getElementById("confidenceValue"),
    confidenceProgress: document.getElementById("confidenceProgress"),
    ageResult: document.getElementById("ageResult"),
    faceCountResult: document.getElementById("faceCountResult"),
    webcamMessage: document.getElementById("webcamMessage"),
    cameraStatusDot: document.getElementById("cameraStatusDot"),
    cameraStatusText: document.getElementById("cameraStatusText")
};

function showApplication() {
    if (UI.applicationLoader) UI.applicationLoader.classList.add("hidden");
    if (UI.application) UI.application.classList.remove("hidden");
}

function updateLoaderMessage(message) {
    if (UI.loaderMessage) UI.loaderMessage.textContent = message;
}

function updateSystemStatus(message, type = "loading") {
    if (!UI.systemStatus) return;
    let dotClass = type === "ready" ? "ready" : "";
    UI.systemStatus.innerHTML = `<span class="status-dot ${dotClass}"></span> ${message}`;
}

function showMessage(title, message, type = "warning") {
    if (!UI.detectionMessage) return;
    UI.detectionMessage.classList.remove("hidden", "message-success", "message-warning", "message-error");
    UI.detectionMessage.classList.add(`message-${type}`);
    if (UI.messageTitle) UI.messageTitle.textContent = title;
    if (UI.messageText) UI.messageText.textContent = message;
}

function hideMessage() {
    if (UI.detectionMessage) UI.detectionMessage.classList.add("hidden");
}

function showProcessing() {
    hideMessage();
    if (UI.processingIndicator) UI.processingIndicator.classList.remove("hidden");
}

function hideProcessing() {
    if (UI.processingIndicator) UI.processingIndicator.classList.add("hidden");
}

/* =========================================================
   DISPLAY RESULT (FIXED)
========================================================= */
function displayResult(data) {
    if (!data) return;

    console.log("Displaying result data:", data);

    // Safely get gender text
    const genderText = data.gender ? String(data.gender).toLowerCase() : "unknown";
    const displayGender = genderText === "male" ? "Male" : genderText === "female" ? "Female" : "Unknown";
    const icon = genderText === "male" ? "" : genderText === "female" ? "♀" : "?";

    // Update Gender
    if (UI.genderResult) UI.genderResult.textContent = displayGender;
    if (UI.genderIcon) UI.genderIcon.textContent = icon;

    // Update Probability
    const probability = Number(data.genderProbability || 0);
    const safeProbability = Math.max(0, Math.min(100, probability));
    if (UI.confidenceValue) UI.confidenceValue.textContent = `${safeProbability.toFixed(1)}%`;
    if (UI.confidenceProgress) UI.confidenceProgress.style.width = `${safeProbability}%`;

    // Update Age
    if (UI.ageResult) {
        const age = Number(data.age);
        UI.ageResult.textContent = Number.isFinite(age) ? `${Math.round(age)} years` : "—";
    }

    // Update Face Count
    if (UI.faceCountResult) UI.faceCountResult.textContent = data.faceCount || 1;

    // Update Image
    if (UI.resultImage && data.imageSource) {
        UI.resultImage.src = data.imageSource;
    }

    // CRITICAL FIX: Always unhide the results section, even if data is slightly malformed
    if (UI.resultsSection) {
        UI.resultsSection.classList.remove("hidden");
        console.log("Results section unhidden successfully.");
    }

    // Show new analysis button
    const newAnalysisBtn = document.getElementById("newAnalysisButton");
    if (newAnalysisBtn) newAnalysisBtn.classList.remove("hidden");

    // Scroll to results
    setTimeout(() => {
        if (UI.resultsSection) {
            UI.resultsSection.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, 100);
}

function setResultImage(imageSource) {
    if (UI.resultImage && imageSource) UI.resultImage.src = imageSource;
}

function hideResults() {
    if (UI.resultsSection) UI.resultsSection.classList.add("hidden");
    const newAnalysisBtn = document.getElementById("newAnalysisButton");
    if (newAnalysisBtn) newAnalysisBtn.classList.add("hidden");
}

function resetResults() {
    hideResults();
    if (UI.genderResult) UI.genderResult.textContent = "--";
    if (UI.genderIcon) UI.genderIcon.textContent = "?";
    if (UI.confidenceValue) UI.confidenceValue.textContent = "--";
    if (UI.confidenceProgress) UI.confidenceProgress.style.width = "0%";
    if (UI.ageResult) UI.ageResult.textContent = "--";
    if (UI.faceCountResult) UI.faceCountResult.textContent = "--";
    if (UI.resultImage) UI.resultImage.src = "";
}

function updateCameraStatus(active) {
    if (!UI.cameraStatusDot || !UI.cameraStatusText) return;
    if (active) {
        UI.cameraStatusDot.classList.add("active");
        UI.cameraStatusText.textContent = "Camera Active";
    } else {
        UI.cameraStatusDot.classList.remove("active");
        UI.cameraStatusText.textContent = "Camera Off";
    }
}

function updateWebcamMessage(title, message) {
    if (!UI.webcamMessage) return;
    UI.webcamMessage.innerHTML = `<div class="camera-placeholder-icon"></div><h4>${title}</h4><p>${message}</p>`;
}

window.UIManager = {
    showApplication, updateLoaderMessage, updateSystemStatus, showMessage, hideMessage,
    showProcessing, hideProcessing, displayResult, setResultImage, hideResults, resetResults,
    updateCameraStatus, updateWebcamMessage
};