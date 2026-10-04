/* =========================================================
   IMAGE HANDLER MODULE
========================================================= */
let selectedImageFile = null;
let selectedImageURL = null;
let imageInput, uploadArea, chooseImageButton, imagePreviewContainer, imagePreview, removeImageButton, analyzeImageButton;

function initializeImageHandler() {
    imageInput = document.getElementById("imageInput");
    uploadArea = document.getElementById("uploadArea");
    chooseImageButton = document.getElementById("chooseImageButton");
    imagePreviewContainer = document.getElementById("imagePreviewContainer");
    imagePreview = document.getElementById("imagePreview");
    removeImageButton = document.getElementById("removeImageButton");
    analyzeImageButton = document.getElementById("analyzeImageButton");

    if (chooseImageButton) chooseImageButton.addEventListener("click", () => imageInput.click());
    if (imageInput) imageInput.addEventListener("change", handleImageSelection);
    if (removeImageButton) removeImageButton.addEventListener("click", clearSelectedImage);
    if (analyzeImageButton) analyzeImageButton.addEventListener("click", analyzeSelectedImage);
    initializeDragAndDrop();
}

function handleImageSelection(event) {
    const file = event.target.files[0];
    if (file) processSelectedFile(file);
}

function processSelectedFile(file) {
    UIManager.hideMessage();
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
        UIManager.showMessage("Invalid Image", "Please select a JPG, PNG or WEBP image.", "error");
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        UIManager.showMessage("File Too Large", "The maximum allowed image size is 10 MB.", "error");
        return;
    }

    selectedImageFile = file;
    if (selectedImageURL) URL.revokeObjectURL(selectedImageURL);
    selectedImageURL = URL.createObjectURL(file);
    
    imagePreview.src = selectedImageURL;
    imagePreviewContainer.classList.remove("hidden");
    uploadArea.classList.add("hidden");
    UIManager.hideResults();
}

async function analyzeSelectedImage() {
    if (!selectedImageFile) {
        UIManager.showMessage("No Image Selected", "Please choose an image before starting analysis.", "warning");
        return;
    }

    try {
        UIManager.showProcessing();
        UIManager.hideResults();
        await waitForImageLoad(imagePreview);

        const validation = await FaceDetection.validateSingleFace(imagePreview);
        if (!validation.valid) {
            UIManager.hideProcessing();
            UIManager.showMessage(validation.reason === "MULTIPLE_FACES" ? "Multiple Faces Detected" : "No Face Detected", validation.message, "warning");
            return;
        }

        const result = await GenderDetection.classifyGender(imagePreview);
        UIManager.hideProcessing();

        if (!result.success) {
            UIManager.showMessage("Detection Failed", result.message, "error");
            return;
        }

        // FIX: Pass a complete object including imageSource and formatted gender
        UIManager.displayResult({
            ...result,
            imageSource: selectedImageURL,
            gender: GenderDetection.formatGender(result.gender)
        });

        UIManager.showMessage("Analysis Complete", `Successfully detected: ${GenderDetection.formatGender(result.gender)} (${result.genderProbability}% confidence)`, "success");
        
        const newAnalysisButton = document.getElementById("newAnalysisButton");
        if (newAnalysisButton) newAnalysisButton.classList.remove("hidden");

    } catch (error) {
        console.error("Image analysis error:", error);
        UIManager.hideProcessing();
        UIManager.showMessage("Analysis Error", error.message || "Unable to analyze the selected image.", "error");
    }
}

function waitForImageLoad(image) {
    return new Promise((resolve, reject) => {
        if (image.complete) return resolve();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("The selected image could not be loaded."));
    });
}

function clearSelectedImage() {
    selectedImageFile = null;
    if (selectedImageURL) { URL.revokeObjectURL(selectedImageURL); selectedImageURL = null; }
    if (imageInput) imageInput.value = "";
    if (imagePreview) imagePreview.src = "";
    if (imagePreviewContainer) imagePreviewContainer.classList.add("hidden");
    if (uploadArea) uploadArea.classList.remove("hidden");
    UIManager.resetResults();
    UIManager.hideMessage();
}

function initializeDragAndDrop() {
    if (!uploadArea) return;
    uploadArea.addEventListener("dragover", (e) => { e.preventDefault(); uploadArea.classList.add("drag-over"); });
    uploadArea.addEventListener("dragleave", () => { uploadArea.classList.remove("drag-over"); });
    uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file) processSelectedFile(file);
    });
}

window.ImageHandler = { initializeImageHandler, analyzeSelectedImage, clearSelectedImage, processSelectedFile };