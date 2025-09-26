// ============================================
// CONFIGURE YOUR URLS HERE
// ============================================
const formA = "https://forms.gle/B6EFnCeANrZ2DQYr6"; // Form A URL
const formB = "https://forms.gle/VHzovnZ2SgKt4FQc6"; // Form B URL
const googleSheetsUrl =
  "https://script.google.com/macros/s/AKfycbzxEQMnnXERy-59MmPeGBz-W8-d1lnuRTB-rfct5-fEbZjPL8H9JB170VNY4KYozGEsCw/exec";

// ============================================
// DO NOT MODIFY BELOW THIS LINE
// ============================================

// Form elements
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
const nameInput = document.getElementById("participantName");
const emailInput = document.getElementById("participantEmail");
const consentButton = document.getElementById("consentButton");
const participateButton = document.getElementById("participateBtn");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const digitalSignature = document.getElementById("digitalSignature");
const studySection = document.getElementById("studySection");

// Statistics tracking
let stats = { formA: 0, formB: 0, total: 0 };
let consentGiven = false;
let participantData = {}; // Store participant data for randomization

// Toggle collapsible sections
function toggleSection(header) {
  const content = header.nextElementSibling;
  const isActive = content.classList.contains("active");

  // Close all sections
  document.querySelectorAll(".section-content").forEach((section) => {
    section.classList.remove("active");
  });
  document.querySelectorAll(".section-header").forEach((h) => {
    h.classList.remove("active");
  });

  // Open clicked section if it wasn't active
  if (!isActive) {
    content.classList.add("active");
    header.classList.add("active");
  }
}

// Check if consent form is complete
function checkConsentCompletion() {
  const allChecked = Array.from(checkboxes).every(
    (checkbox) => checkbox.checked
  );
  const nameCompleted = nameInput.value.trim().length > 0;
  const emailCompleted =
    emailInput.value.trim().length > 0 && emailInput.validity.valid;

  const formComplete = allChecked && nameCompleted && emailCompleted;
  consentButton.disabled = !formComplete;

  // Update digital signature preview
  if (nameCompleted && emailCompleted) {
    const now = new Date();
    digitalSignature.className = "digital-signature completed";
    digitalSignature.innerHTML = `
      <div class="signature-name">${nameInput.value.trim()}</div>
      <div class="signature-email">${emailInput.value.trim()}</div>
      <div class="signature-date">Digitally signed on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}</div>
    `;
  } else {
    digitalSignature.className = "digital-signature";
    digitalSignature.innerHTML =
      "Digital signature will appear here when form is completed";
  }

  // Hide error message if form becomes complete
  if (formComplete) {
    errorMessage.style.display = "none";
  }
}

// Record consent
function recordConsent() {
  // Final validation
  if (consentButton.disabled) {
    errorMessage.style.display = "block";
    errorMessage.scrollIntoView({ behavior: "smooth" });
    return;
  }

  // Store participant data
  participantData = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    consentTimestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };

  // Show processing state
  consentButton.disabled = true;
  consentButton.textContent = "⏳ Recording Consent...";

  // Send initial consent to Google Sheets using GET method
  const params = new URLSearchParams({
    action: "consent",
    name: participantData.name,
    email: participantData.email,
    timestamp: participantData.consentTimestamp,
    userAgent: participantData.userAgent,
  });

  fetch(`${googleSheetsUrl}?${params.toString()}`, {
    method: "GET",
  })
    .then((response) => response.text())
    .then((result) => {
      console.log("Consent recorded:", result);
      completeConsent();
    })
    .catch((error) => {
      console.error("Error recording consent:", error);
      completeConsent(); // Still proceed even if recording fails
    });
}

// Complete consent process
function completeConsent() {
  consentGiven = true;
  consentButton.textContent = "✅ Consent Recorded";
  successMessage.style.display = "block";

  // Enable study section
  studySection.classList.add("enabled");
  participateButton.disabled = false;

  // Scroll to study section
  setTimeout(() => {
    studySection.scrollIntoView({ behavior: "smooth" });
  }, 500);
}

// Random redirect to study with tracking
function randomRedirect() {
  if (!consentGiven) {
    alert("Please complete the consent process first!");
    return;
  }

  // Check if URLs are configured
  if (!formA || !formB) {
    alert("Study URLs not configured. Please contact the research team.");
    return;
  }

  // Show processing state
  participateButton.disabled = true;
  participateButton.textContent = "⏳ Assigning Condition...";

  // Random assignment (50/50 chance)
  const isFormA = Math.random() < 0.5;
  const assignedCondition = isFormA ? "A" : "B";
  const targetUrl = isFormA ? formA : formB;

  // Prepare randomization data
  const randomizationData = {
    ...participantData,
    assignedCondition: assignedCondition,
    targetUrl: targetUrl,
    randomizationTimestamp: new Date().toISOString(),
  };

  // Update statistics
  if (isFormA) {
    stats.formA++;
  } else {
    stats.formB++;
  }
  stats.total++;

  // Log the assignment
  console.log(`Assigned to: Condition ${assignedCondition}`);
  console.log(`Redirecting to: ${targetUrl}`);

  // Send randomization data to Google Sheets
  const randomizationParams = new URLSearchParams({
    action: "randomization",
    name: randomizationData.name,
    email: randomizationData.email,
    consentTimestamp: randomizationData.consentTimestamp,
    assignedCondition: randomizationData.assignedCondition,
    targetUrl: randomizationData.targetUrl,
    randomizationTimestamp: randomizationData.randomizationTimestamp,
    userAgent: randomizationData.userAgent,
  });

  fetch(`${googleSheetsUrl}?${randomizationParams.toString()}`, {
    method: "GET",
  })
    .then((response) => response.text())
    .then((result) => {
      console.log("Randomization recorded:", result);
      // Redirect after recording randomization
      window.location.href = targetUrl;
    })
    .catch((error) => {
      console.error("Error recording randomization:", error);
      // Still redirect even if recording fails
      window.location.href = targetUrl;
    });
}

// Add event listeners
checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", checkConsentCompletion);
});

nameInput.addEventListener("input", checkConsentCompletion);
emailInput.addEventListener("input", checkConsentCompletion);

// Initialize
checkConsentCompletion();
