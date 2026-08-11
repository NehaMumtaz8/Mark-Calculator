/* =========================================================
   MARK CALCULATOR - JAVASCRIPT
   Simple, well-commented vanilla JS for a college project
   ========================================================= */

// ---------------------------------------------------------
// GLOBAL VARIABLES
// ---------------------------------------------------------

// Keeps track of a unique id for every subject row we create
let subjectCounter = 0;

// Default subjects shown when the page loads (or after Reset)
const DEFAULT_SUBJECTS = ["Subject 1", "Subject 2", "Subject 3"];

// Grab commonly used elements once, so we don't query the DOM repeatedly
const marksTableBody = document.getElementById("marksTableBody");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const calculateBtn = document.getElementById("calculateBtn");
const resetBtn = document.getElementById("resetBtn");
const errorBox = document.getElementById("errorBox");
const resultCard = document.getElementById("resultCard");

const studentNameInput = document.getElementById("studentName");

// ---------------------------------------------------------
// INITIAL SETUP
// ---------------------------------------------------------

// Build the starting table with 3 default subjects when the page loads
function initializeTable() {
  marksTableBody.innerHTML = "";
  subjectCounter = 0;
  DEFAULT_SUBJECTS.forEach((name) => addSubjectRow(name));
}

// ---------------------------------------------------------
// ADD / REMOVE SUBJECT ROWS
// ---------------------------------------------------------

// Creates one <tr> row for a subject and appends it to the table body
function addSubjectRow(subjectName = "") {
  subjectCounter++;
  const rowId = "row-" + subjectCounter;

  // Create the table row element
  const row = document.createElement("tr");
  row.id = rowId;

  // Fill the row with input cells
  row.innerHTML = `
    <td><input type="text" class="subjectName" placeholder="Subject name" value="${subjectName}"></td>
    <td><input type="number" class="maxMark" placeholder="Max" min="1"></td>
    <td><input type="number" class="internalMark" placeholder="Internal" min="0"></td>
    <td><input type="number" class="externalMark" placeholder="External" min="0"></td>
    <td class="total-cell"><span class="totalMark">0</span></td>
    <td class="resultCell"><span class="result-pending">-</span></td>
    <td><button type="button" class="remove-btn" title="Remove subject">✕</button></td>
  `;

  marksTableBody.appendChild(row);

  // Listen for changes in the Internal / External mark fields
  // so the Total updates automatically as the user types
  const internalInput = row.querySelector(".internalMark");
  const externalInput = row.querySelector(".externalMark");
  internalInput.addEventListener("input", () => updateRowTotal(row));
  externalInput.addEventListener("input", () => updateRowTotal(row));

  // Remove button deletes this row (but keeps at least 1 subject)
  const removeBtn = row.querySelector(".remove-btn");
  removeBtn.addEventListener("click", () => {
    if (marksTableBody.children.length > 1) {
      row.remove();
    } else {
      showError("At least one subject is required.");
    }
  });
}

// "+ Add Subject" button handler
addSubjectBtn.addEventListener("click", () => {
  addSubjectRow("");
});

// ---------------------------------------------------------
// AUTOMATIC TOTAL CALCULATION
// ---------------------------------------------------------

// Recalculates Total = Internal + External for a given row
function updateRowTotal(row) {
  const internal = parseFloat(row.querySelector(".internalMark").value) || 0;
  const external = parseFloat(row.querySelector(".externalMark").value) || 0;
  const total = internal + external;
  row.querySelector(".totalMark").textContent = total;
}

// ---------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------

// Shows an error message at the top of the page
function showError(message) {
  errorBox.textContent = "⚠ " + message;
  errorBox.classList.remove("hidden");
  errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Hides the error message box
function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

// Removes the red "input-error" highlight from every mark field
function clearInputErrorHighlights() {
  document.querySelectorAll("td input").forEach((input) => {
    input.classList.remove("input-error");
  });
}

// Validates the student details + every subject row.
// Returns an array of subject data objects if everything is valid,
// or null if validation failed (an error message is also shown).
function validateAndCollectData() {
  clearError();
  clearInputErrorHighlights();

  // ---- Validate student name ----
  const studentName = studentNameInput.value.trim();
  if (studentName === "") {
    studentNameInput.classList.add("input-error");
    showError("Student name cannot be empty.");
    return null;
  }

  const rows = marksTableBody.querySelectorAll("tr");
  const subjects = [];

  for (const row of rows) {
    const subjectNameInput = row.querySelector(".subjectName");
    const maxMarkInput = row.querySelector(".maxMark");
    const internalInput = row.querySelector(".internalMark");
    const externalInput = row.querySelector(".externalMark");

    const subjectName = subjectNameInput.value.trim();
    const maxMark = parseFloat(maxMarkInput.value);
    const internalMark = parseFloat(internalInput.value);
    const externalMark = parseFloat(externalInput.value);

    // ---- Subject name cannot be empty ----
    if (subjectName === "") {
      subjectNameInput.classList.add("input-error");
      showError("Subject name cannot be empty.");
      return null;
    }

    // ---- Maximum mark must be a number greater than 0 ----
    if (isNaN(maxMark) || maxMark <= 0) {
      maxMarkInput.classList.add("input-error");
      showError(`"${subjectName}": Maximum mark must be greater than 0.`);
      return null;
    }

    // ---- Marks cannot be negative or empty ----
    if (isNaN(internalMark) || internalMark < 0 || isNaN(externalMark) || externalMark < 0) {
      internalInput.classList.add("input-error");
      externalInput.classList.add("input-error");
      showError(`"${subjectName}": Marks cannot be negative or empty.`);
      return null;
    }

    // ---- Internal + External cannot exceed Maximum mark ----
    const total = internalMark + externalMark;
    if (total > maxMark) {
      internalInput.classList.add("input-error");
      externalInput.classList.add("input-error");
      showError(`"${subjectName}": Internal + External (${total}) cannot exceed Maximum Mark (${maxMark}).`);
      return null;
    }

    // Store the valid data for this subject
    subjects.push({
      row: row,
      name: subjectName,
      max: maxMark,
      internal: internalMark,
      external: externalMark,
      total: total,
    });
  }

  return subjects;
}

// ---------------------------------------------------------
// GRADE CALCULATION
// ---------------------------------------------------------

// Converts a percentage number into a letter grade
function getGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "F";
}

// ---------------------------------------------------------
// CALCULATE RESULT
// ---------------------------------------------------------

calculateBtn.addEventListener("click", () => {
  const subjects = validateAndCollectData();
  if (!subjects) return; // Stop here if validation failed

  let totalObtained = 0;
  let totalMax = 0;
  let allSubjectsPass = true;

  // Loop through each subject to update its Result cell (Pass/Fail)
  // and accumulate the totals needed for the overall result
  subjects.forEach((subject) => {
    totalObtained += subject.total;
    totalMax += subject.max;

    const subjectPercentage = (subject.total / subject.max) * 100;
    const resultCell = subject.row.querySelector(".resultCell");

    if (subjectPercentage >= 40) {
      resultCell.innerHTML = `<span class="result-pass">PASS</span>`;
    } else {
      resultCell.innerHTML = `<span class="result-fail">FAIL</span>`;
      allSubjectsPass = false;
    }
  });

  // ---- Overall calculations ----
  const average = totalObtained / subjects.length;
  const percentage = (totalObtained / totalMax) * 100;
  const grade = getGrade(percentage);
  const overallResult = allSubjectsPass ? "PASS" : "FAIL";

  displayResult(totalObtained, totalMax, average, percentage, grade, overallResult);
});

// ---------------------------------------------------------
// DISPLAY RESULT CARD
// ---------------------------------------------------------

function displayResult(totalObtained, totalMax, average, percentage, grade, overallResult) {
  document.getElementById("resTotal").textContent = `${totalObtained} / ${totalMax}`;
  document.getElementById("resAverage").textContent = average.toFixed(2);
  document.getElementById("resPercentage").textContent = percentage.toFixed(2) + "%";
  document.getElementById("resGrade").textContent = grade;

  const resStatus = document.getElementById("resStatus");
  resStatus.textContent = overallResult;
  resStatus.classList.remove("pass", "fail");
  resStatus.classList.add(overallResult === "PASS" ? "pass" : "fail");

  // Update the progress bar to visually show the percentage
  const progressBar = document.getElementById("progressBar");
  const roundedPercentage = Math.min(100, Math.max(0, percentage)).toFixed(1);
  progressBar.style.width = roundedPercentage + "%";
  progressBar.textContent = roundedPercentage + "%";

  // Reveal the result card and scroll to it
  resultCard.classList.remove("hidden");
  resultCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ---------------------------------------------------------
// RESET CALCULATOR
// ---------------------------------------------------------

resetBtn.addEventListener("click", () => {
  // Clear student details
  document.getElementById("studentName").value = "";
  document.getElementById("registerNumber").value = "";
  document.getElementById("course").value = "";
  document.getElementById("semester").value = "";

  // Rebuild the marks table with the default 3 subjects
  initializeTable();

  // Hide the result card and any error messages
  resultCard.classList.add("hidden");
  clearError();
  clearInputErrorHighlights();
});

// ---------------------------------------------------------
// RUN ON PAGE LOAD
// ---------------------------------------------------------

initializeTable();
