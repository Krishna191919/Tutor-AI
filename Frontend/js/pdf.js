//  pdf.js — PDF and text file handling

let uploadedDocuments = []; // Array of {name, text} objects
const MAX_FILES = 3;

//  Handle file upload (multiple files, max 3)
async function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  const status = document.getElementById("pdfStatus");
  status.classList.remove("hidden", "error");

  // Check file limit
  if (files.length > MAX_FILES) {
    status.classList.add("error");
    status.innerText = `❌ Maximum ${MAX_FILES} files allowed. You selected ${files.length}.`;
    document
      .querySelectorAll("input[type='file']")
      .forEach((i) => (i.value = ""));
    return;
  }

  try {
    uploadedDocuments = []; // Reset documents array
    let imageCount = 0;
    const docNames = [];
    const totalWords = [];

    for (const file of files) {
      const fileType = file.type || "";
      const extension = file.name.split(".").pop().toLowerCase();

      // IMAGE — send to Gemini via image handler
      if (
        fileType.startsWith("image/") ||
        ["png", "jpg", "jpeg", "webp"].includes(extension)
      ) {
        imageCount++;
        if (imageCount === 1) {
          // Only use first image
          const reader = new FileReader();
          reader.onload = function (e) {
            const base64 = e.target.result;
            currentImageBase64 = base64.split(",")[1];
            currentImageType = fileType || `image/${extension}`;
            showImagePreview(base64);
          };
          reader.readAsDataURL(file);
        }
        continue;
      }

      // PDF/TXT — add to documents
      let text = "";
      if (fileType === "application/pdf" || extension === "pdf") {
        text = await extractPDFText(file);
      } else if (fileType === "text/plain" || extension === "txt") {
        text = await extractTxtText(file);
      } else {
        throw new Error(`Unsupported file: ${file.name}`);
      }

      if (text.trim().length < 50) {
        throw new Error(`File "${file.name}" is empty or unreadable`);
      }

      uploadedDocuments.push({ name: file.name, text: text.trim() });
      docNames.push(file.name);
      totalWords.push(countWords(text));
    }

    if (uploadedDocuments.length === 0 && imageCount === 0) {
      throw new Error("No valid files uploaded");
    }

    // Show status
    if (uploadedDocuments.length > 0) {
      status.innerText = `✅ Loaded ${uploadedDocuments.length} document(s): ${docNames.join(", ")} (${totalWords.join(", ")} words)`;

      // Start a fresh chat
      conversationMessages = [];
      clearQuestionInputs();
      clearImage();
      document.getElementById("readBtn").classList.add("hidden");
      document.getElementById("chatMessages").innerHTML = "";
      document.querySelectorAll(".history-item").forEach((el) => {
        el.classList.remove("active");
      });

      const docList = uploadedDocuments.map((d) => `**${d.name}**`).join(", ");
      appendMessage(
        "assistant",
        `I've read ${uploadedDocuments.length} document(s): ${docList}.\n\nAsk me anything about them!\n\nFor example:\n- Summarize these documents\n- What are the common topics?\n- Compare the documents`,
      );
      switchToChatScreen();
    } else if (imageCount > 0) {
      status.innerText = `✅ Image ready — ask your question!`;
    }
  } catch (err) {
    status.classList.add("error");
    status.innerText = "❌ " + err.message;
    uploadedDocuments = [];
  }

  // Reset inputs
  document
    .querySelectorAll("input[type='file']")
    .forEach((i) => (i.value = ""));
}

//  Extract text from PDF
async function extractPDFText(file) {
  // Set worker
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  const maxPages = Math.min(pdf.numPages, 30); // max 30 pages

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n\n";
  }

  return fullText;
}

//  Extract text from .txt file
async function extractTxtText(file) {
  return await file.text();
}

//  Word count helper
function countWords(text) {
  return text.trim().split(/\s+/).length.toLocaleString();
}

//  Clear documents
function clearDocument() {
  uploadedDocuments = [];
  const status = document.getElementById("pdfStatus");
  status.classList.add("hidden");
  status.innerText = "";
}
