// Global variables
const pdfFile = document.getElementById("pdfFile");
const pagesContainer = document.getElementById("pagesContainer");
const dragDropArea = document.getElementById("dragDropArea");
const textTool = document.getElementById("textTool");
const signatureTool = document.getElementById("signatureTool");
const tickmarkTool = document.getElementById("tickmarkTool");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const savePDFBtn = document.getElementById("savePDF");
const uploadPDFBtn = document.getElementById("uploadPDF");

const clearAllBtn = document.getElementById("clearAll");
const signatureModal = document.getElementById("signatureModal");
const signatureCanvas = document.getElementById("signatureCanvas");
const clearSignatureBtn = document.getElementById("clearSignature");
const saveSignatureBtn = document.getElementById("saveSignature");
const closeSignatureBtn = document.getElementById("closeSignature");
const fileInput = document.getElementById("pdfFile");
const imageModal = document.getElementById('imageModal');
const imageFile = document.getElementById('imageFile');
const imagePreview = document.getElementById('imagePreview');
const uploadImageBtn = document.getElementById('uploadImage');
const closeImageBtn = document.getElementById('closeImage');
const imageTool = document.getElementById('imageTool');
const textFormatToolbar = document.getElementById("textFormatToolbar");
const fontFamilySelect = document.getElementById("fontFamily");
const fontSizeSelect = document.getElementById("fontSize");
const boldButton = document.getElementById("boldText");
const italicButton = document.getElementById("italicText");
const underlineButton = document.getElementById("underlineText");
const colorPicker = document.getElementById("textColor");
const assetItems = document.querySelectorAll('.asset-item');
const roundTool = document.getElementById("roundTool");
const crossTool = document.getElementById("crossTool");
const rectangleTool = document.getElementById("rectangleTool");
const notification = document.getElementById('notification');
const previewPDFBtn = document.getElementById('previewPDF');
const previewModal = document.getElementById('previewModal');
const closePreviewBtn = document.getElementById('closePreview');
const previewContainer = document.getElementById('previewContainer');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const fitWidthBtn = document.getElementById('fitWidth');
const zoomLevelSpan = document.querySelector('.zoom-level');
// Create a URLSearchParams object from the current URL
const params = new URLSearchParams(window.location.search);
const id = params.get('ID');
const CrtNo = params.get('CrtNo');

// State variables
let currentPDF = null;
let currentTool = null;
let annotations = new Map(); // Map to store annotations for each page
let scale = 1.5;
let isSignatureDrawing = false;
let signatureX, signatureY;
let selectedImage = null;
let activeTextAnnotation = null;
let undoStack = [];
let redoStack = [];
let isDrawing = false;
let currentScale = 1.5;
let totalPages = 1;
let currentZoom = 80;
const ZOOM_STEP = 10;
const MIN_ZOOM = 50;
const MAX_ZOOM = 100;

// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Initialize jsPDF
window.jsPDF = window.jspdf.jsPDF;

// Initialize canvas contexts
const signatureCtx = signatureCanvas.getContext("2d");
const freaze = document.getElementById("freaze");

// Function to download a certificate from a third-party server

async function downloadCertificate() {
    freaze.style.display = "flex";
  try {
    console.log('Starting PDF download');
   
    const response = await fetch("https://mcb.medicalcertificate.in/getcustomcertificate/"+id, {
      method: "GET",
      headers: {
        'Accept': 'application/pdf'
      }
    });

    if (response.ok) {
      const data = await response.blob();
      console.log("Download successful, PDF blob size:", data.size);
      return data;
    } else {
      console.error("Failed to fetch certificate:", response.statusText);
    }
  } catch (exception) {
    console.error("Error occurred:", exception);
  }
  return null;
}

// Function to load a PDF from a Blob
async function loadPDFFromBlob(blob) {
  if (!blob) {
    console.error("No PDF blob provided to load.");
    return;
  }

  try {
    document.body.style.cursor = "wait";
    const pdfData = await blob.arrayBuffer();

    if (currentPDF) {
      await currentPDF.destroy();
      currentPDF = null;
    }

    // Clear existing pages
    pagesContainer.innerHTML = '';
    annotations.clear();
    
    currentPDF = await pdfjsLib.getDocument({ data: pdfData }).promise;
    totalPages = currentPDF.numPages;
    console.log(`Total pages in PDF: ${totalPages}`);
    
    // Render pages sequentially to avoid memory issues
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      console.log(`Starting to render page ${pageNum}`);
      await renderPage(pageNum);
    }
    
    console.log('All pages rendered');
    document.body.style.cursor = "default";
  } catch (error) {
    console.error("Error loading PDF:", error);
    document.body.style.cursor = "default";
  }
  freaze.style.display = "none";
}
// Function to handle responsive PDF rendering
function handleResponsivePDF() {
  const container = document.getElementById('pagesContainer');
  const containerWidth = container.clientWidth - 40; // Account for padding
  const defaultScale = 1;
  
  if (!currentPDF) return defaultScale;
  
  // Get the first page to calculate scale
  return currentPDF.getPage(1).then(page => {
      const viewport = page.getViewport({ scale: defaultScale });
      const scaleRequired = containerWidth / viewport.width;
      return Math.min(scaleRequired, 2); // Cap maximum scale at 2
  });
}
// Function to render a specific page of the PDF
// async function renderPage(pageNumber) {
//   try {
//     if (!currentPDF) {
//       console.error('No PDF loaded');
//       return;
//     }

//     console.log(`Rendering page ${pageNumber}`);
//     const page = await currentPDF.getPage(pageNumber);
//     const scale = await handleResponsivePDF();
    
//     const viewport = page.getViewport({ scale });
    
    
//     // Create page wrapper
//     const pageWrapper = document.createElement('div');
//     pageWrapper.className = 'page-wrapper';
//     pageWrapper.setAttribute('data-page', pageNumber);
    
//     // Add page number label
//     const pageLabel = document.createElement('div');
//     pageLabel.className = 'page-number';
//     pageLabel.textContent = `Page ${pageNumber}`;
//     pageWrapper.appendChild(pageLabel);
    
//     // Create canvas for this page
//     const canvas = document.createElement('canvas');
//     canvas.className = 'pdf-canvas';
//     canvas.setAttribute('data-page', pageNumber);
//     const ctx = canvas.getContext('2d', { alpha: false });
//     canvas.width = viewport.width;
//     canvas.height = viewport.height;
    
//     // Create annotation layer for this page
//     const annotationLayerDiv = document.createElement('div');
//     annotationLayerDiv.className = 'annotation-layer';
//     annotationLayerDiv.setAttribute('data-page', pageNumber);
//     annotationLayerDiv.style.width = `${viewport.width}px`;
//     annotationLayerDiv.style.height = `${viewport.height}px`;
    
//     // Add click handlers for annotations
//     annotationLayerDiv.addEventListener('click', (e) => {
//       console.log('Annotation layer clicked');
      
//         if (e.target === annotationLayerDiv) {
//             const rect = annotationLayerDiv.getBoundingClientRect();
//             const x = e.clientX - rect.left;
//             const y = e.clientY - rect.top;
// console.log(x,y);

//             if (currentTool === "text") {
//               addTextAnnotation(x, y, pageNumber);
//             } else if (currentTool === "tick") {
//               addTickMark(x, y, pageNumber);
//             } else if (currentTool === "round") {
//               addRoundAnnotation(x, y, pageNumber);
//             } else if (currentTool === "cross") {
//               addCrossAnnotation(x, y, pageNumber);
//             } else if (currentTool === "rectangle") {
//               addRectangleAnnotation(x, y, pageNumber);
//             } else if (currentTool === "image" && selectedImage) {
//               imageModal.style.display = "block";
//               imagePreview.style.display = "none";
//               imageFile.value = "";
              
//               // Store click coordinates and page number for later use
//               imageModal.dataset.clickX = x;
//               imageModal.dataset.clickY = y;
//               imageModal.dataset.pageNumber = pageNumber;
//             }
//           }
//     });

//     // // Add drag and drop handlers for assets
//     // annotationLayerDiv.addEventListener('dragover', (e) => {
//     //   e.preventDefault();
//     //   e.dataTransfer.dropEffect = 'copy';
//     // });

//     // annotationLayerDiv.addEventListener('drop', (e) => {
//     //   e.preventDefault();
//     //   const imageSrc = e.dataTransfer.getData('text/plain');
//     //   if (imageSrc) {
//     //     const rect = annotationLayerDiv.getBoundingClientRect();
//     //     const x = e.clientX - rect.left - 50;
//     //     const y = e.clientY - rect.top - 50;
//     //     addImageAnnotation(x, y, imageSrc, pageNumber);
//     //     saveState();
//     //   }
//     // });
    
//     // Initialize annotations array for this page
//     annotations.set(pageNumber, []);
    
//     pageWrapper.appendChild(canvas);
//     pageWrapper.appendChild(annotationLayerDiv);
//     pagesContainer.appendChild(pageWrapper);

//     // Render PDF page
//     const renderContext = {
//       canvasContext: ctx,
//       viewport: viewport,
//       background: 'white'
//     };

//     try {
//       await page.render(renderContext).promise;
//       console.log(`Finished rendering page ${pageNumber}`);
//     } catch (renderError) {
//       console.error(`Error rendering page ${pageNumber}:`, renderError);
//     }
    
//   } catch (error) {
//     console.error(`Error rendering page ${pageNumber}:`, error);
//   }
// }
async function renderPage(pageNumber) {
  try {
    if (!currentPDF) {
      console.error('No PDF loaded');
      return;
    }

    console.log(`Rendering page ${pageNumber}`);
    const page = await currentPDF.getPage(pageNumber);
    const scale = await handleResponsivePDF();
    
    const viewport = page.getViewport({ scale });

    // Get device pixel ratio for better resolution
    const dpr = window.devicePixelRatio || 1;

    // Create page wrapper
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'page-wrapper';
    pageWrapper.setAttribute('data-page', pageNumber);

    // Add page number label
    const pageLabel = document.createElement('div');
    pageLabel.className = 'page-number';
    pageLabel.textContent = `Page ${pageNumber}`;
    pageWrapper.appendChild(pageLabel);

    // Create canvas for this page
    const canvas = document.createElement('canvas');
    canvas.className = 'pdf-canvas';
    canvas.setAttribute('data-page', pageNumber);
    const ctx = canvas.getContext('2d', { alpha: false });

    // Adjust canvas for high-resolution rendering
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    // Scale context to match high resolution
    ctx.scale(dpr, dpr);

    // Create annotation layer
    const annotationLayerDiv = document.createElement('div');
    annotationLayerDiv.className = 'annotation-layer';
    annotationLayerDiv.setAttribute('data-page', pageNumber);
    annotationLayerDiv.style.width = `${viewport.width}px`;
    annotationLayerDiv.style.height = `${viewport.height}px`;

    annotationLayerDiv.addEventListener('click', (e) => {
      console.log('Annotation layer clicked');
      const rect = annotationLayerDiv.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (currentTool === "text") {
        addTextAnnotation(x, y, pageNumber);
      } else if (currentTool === "tick") {
        addTickMark(x, y, pageNumber);
      } else if (currentTool === "round") {
        addRoundAnnotation(x, y, pageNumber);
      } else if (currentTool === "cross") {
        addCrossAnnotation(x, y, pageNumber);
      } else if (currentTool === "rectangle") {
        addRectangleAnnotation(x, y, pageNumber);
      } else if (currentTool === "image" && selectedImage) {
        imageModal.style.display = "block";
        imagePreview.style.display = "none";
        imageFile.value = "";
        imageModal.dataset.clickX = x;
        imageModal.dataset.clickY = y;
        imageModal.dataset.pageNumber = pageNumber;
      }
    });

    // Initialize annotations array for this page
    annotations.set(pageNumber, []);

    pageWrapper.appendChild(canvas);
    pageWrapper.appendChild(annotationLayerDiv);
    pagesContainer.appendChild(pageWrapper);

    // Render PDF page
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      background: 'white'
    };

    try {
      await page.render(renderContext).promise;
      console.log(`Finished rendering page ${pageNumber}`);
    } catch (renderError) {
      console.error(`Error rendering page ${pageNumber}:`, renderError);
    }
    
  } catch (error) {
    console.error(`Error rendering page ${pageNumber}:`, error);
  }
}

// // Function to add text annotation
// function addTextAnnotation(x, y, pageNumber) {
//   const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
//   if (!annotationLayerDiv) return;
//   const maincontainer = document.createElement('div');
//   maincontainer.className = 'annotation maindiv';
//   maincontainer.style.left = `${x}px`;
//   maincontainer.style.top = `${y}px`;
//   const container = document.createElement('div');
//   container.className = 'annotation text-annotation';
//   container.contentEditable = true;
//  let fontFamilySelectvalue=12;
//   if (window.matchMedia("(max-width: 768px)").matches) {
//     console.log("Screen width is 768px or less");
//     fontFamilySelectvalue=8;
// } else {
//     console.log("Screen width is greater than 768px");
//     fontFamilySelectvalue=16;
// }
//   container.style.fontFamily = fontFamilySelect.value;
//   container.style.fontSize = `${fontFamilySelectvalue}px`;
//   container.style.color = colorPicker.value;
//   container.innerHTML = 'Click to edit text';

//   const deleteWrapper = document.createElement('div');
//   deleteWrapper.className = 'delete-wrapper';
//   const deleteBtn = createDeleteButton();
//   deleteBtn.addEventListener('click', (e) => {
//       e.stopPropagation();
//       deleteAnnotation(maincontainer);
//   });
//   deleteWrapper.appendChild(deleteBtn);


//   let isFirstClick = true;
//   container.addEventListener('click', (e) => {
//       if (isFirstClick || container.innerText === "Click to edit text") {
//           container.innerText = '';
//           isFirstClick = false;
//       }
//       container.focus();
//       e.stopPropagation(); // Prevent click from triggering drag
//   });

//   container.addEventListener('keydown', () => {
//       if (isFirstClick || container.innerText === "Click to edit text") {
//           container.innerText = '';
//           isFirstClick = false;
//       }
//   });

//   container.addEventListener('focus', () => {
//       activeTextAnnotation = container;
//       textFormatToolbar.style.display = 'flex';
//       deleteBtn.style.opacity = 1;
//       positionFormatToolbar(container);
//       updateToolbarState(container);
//   });

//   container.addEventListener('blur', (e) => {
//       if (!e.relatedTarget || !textFormatToolbar.contains(e.relatedTarget)) {
//           textFormatToolbar.style.display = 'none';
//           deleteBtn.style.opacity = 0;
//           if (container.textContent.trim() === '') {
//               container.innerHTML = 'Click to edit text';
//           }
//           activeTextAnnotation = null;
//       }
//   });

//   container.addEventListener('input', saveState);

//   container.addEventListener('mousedown', (e) => e.stopPropagation());

//   //////////////// DRAG (Improved)
//   let isDragging = false;
//   let startX, startY;

//   function startDrag(e) {
//       if (e.buttons === 1) { // Check for left mouse button
//           isDragging = true;
//           startX = e.clientX - maincontainer.offsetLeft;
//           startY = e.clientY - maincontainer.offsetTop;
//           e.stopPropagation();
//       }
//   }

//   function moveDrag(e) {
//       if (!isDragging) return;

//       let newX = e.clientX - startX;
//       let newY = e.clientY - startY;
//       const annotationLayerRect = annotationLayerDiv.getBoundingClientRect();
//       const containerRect = container.getBoundingClientRect();
//       if (newX < 0) newX = 0;
//       if (newY < 0) newY = 0;
//       if (newX + containerRect.width > annotationLayerRect.width)
//           newX = annotationLayerRect.width - containerRect.width;
//       if (newY + containerRect.height > annotationLayerRect.height)
//           newY = annotationLayerRect.height - containerRect.height;

//       maincontainer.style.left = `${newX}px`;
//       maincontainer.style.top = `${newY}px`;
//   }

//   function stopDrag(e) {
//       isDragging = false;
//       saveState();
//   }

//   container.addEventListener('mousedown', startDrag);
//   document.addEventListener('mousemove', moveDrag);
//   document.addEventListener('mouseup', stopDrag);


//   maincontainer.appendChild(container);
//   maincontainer.appendChild(deleteWrapper);
//   annotationLayerDiv.appendChild(maincontainer);
//   container.focus();
//   saveState();
//   currentTool = null;
//   textTool.classList.remove("active");
//   return maincontainer;
// }
// // Function to add text annotation
// function addTextAnnotation(x, y, pageNumber) {
//   const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
//   if (!annotationLayerDiv) return;
//   const maincontainer = document.createElement('div');
//   maincontainer.className = 'annotation maindiv';
//   maincontainer.style.left = `${x}px`;
//   maincontainer.style.top = `${y}px`;
//   const container = document.createElement('div');
//   container.className = 'annotation text-annotation';
//   container.contentEditable = true;
//   container.style.fontFamily = fontFamilySelect.value;
//   let fontFamilySelectvalue=12;
//   if (window.matchMedia("(max-width: 768px)").matches) {
//     console.log("Screen width is 768px or less");
//     fontFamilySelectvalue=8;
// } else {
//     console.log("Screen width is greater than 768px");
//     fontFamilySelectvalue=16;
// }
//   container.style.fontSize = `${   fontFamilySelectvalue  }px`;
//   container.style.color = colorPicker.value;
//   container.innerHTML = 'Click to edit text';

//   const deleteWrapper = document.createElement('div');
//   deleteWrapper.className = 'delete-wrapper';
//   const deleteBtn = createDeleteButton();
//   deleteBtn.addEventListener('click', (e) => {
//       e.stopPropagation();
//       deleteAnnotation(maincontainer);
//   });
//   deleteWrapper.appendChild(deleteBtn);


//   let isFirstClick = true;
//   container.addEventListener('click', (e) => {
//       if (isFirstClick || container.innerText === "Click to edit text") {
//           container.innerText = '';
//           isFirstClick = false;
//       }
//       container.focus();
//       e.stopPropagation(); // Prevent click from triggering drag
//   });

//   container.addEventListener('keydown', () => {
//       if (isFirstClick || container.innerText === "Click to edit text") {
//           container.innerText = '';
//           isFirstClick = false;
//       }
//   });

//   container.addEventListener('focus', () => {
//       activeTextAnnotation = container;
//       textFormatToolbar.style.display = 'flex';
//       deleteBtn.style.opacity = 1;
//       positionFormatToolbar(container);
//       updateToolbarState(container);
//   });

//   container.addEventListener('blur', (e) => {
//       if (!e.relatedTarget || !textFormatToolbar.contains(e.relatedTarget)) {
//           textFormatToolbar.style.display = 'none';
//           deleteBtn.style.opacity = 0;
//           if (container.textContent.trim() === '') {
//               container.innerHTML = 'Click to edit text';
//           }
//           activeTextAnnotation = null;
//       }
//   });

//   container.addEventListener('input', saveState);

//   container.addEventListener('mousedown', (e) => e.stopPropagation());

//   //////////////// DRAG (Improved)
//   let isDragging = false;
//   let startX, startY;

//   function startDrag(e) {
//       if (e.buttons === 1) { // Check for left mouse button
//           isDragging = true;
//           startX = e.clientX - maincontainer.offsetLeft;
//           startY = e.clientY - maincontainer.offsetTop;
//           e.stopPropagation();
//       }
//   }

//   function moveDrag(e) {
//       if (!isDragging) return;

//       let newX = e.clientX - startX;
//       let newY = e.clientY - startY;
//       const annotationLayerRect = annotationLayerDiv.getBoundingClientRect();
//       const containerRect = container.getBoundingClientRect();
//       if (newX < 0) newX = 0;
//       if (newY < 0) newY = 0;
//       if (newX + containerRect.width > annotationLayerRect.width)
//           newX = annotationLayerRect.width - containerRect.width;
//       if (newY + containerRect.height > annotationLayerRect.height)
//           newY = annotationLayerRect.height - containerRect.height;

//       maincontainer.style.left = `${newX}px`;
//       maincontainer.style.top = `${newY}px`;
//   }

//   function stopDrag(e) {
//       isDragging = false;
//       saveState();
//   }

//   container.addEventListener('mousedown', startDrag);
//   document.addEventListener('mousemove', moveDrag);
//   document.addEventListener('mouseup', stopDrag);


//   maincontainer.appendChild(container);
//   maincontainer.appendChild(deleteWrapper);
//   annotationLayerDiv.appendChild(maincontainer);
//   container.focus();
//   saveState();
//   currentTool = null;
//   textTool.classList.remove("active");
//   return maincontainer;
// }
// Function to add text annotation
function addTextAnnotation(x, y, pageNumber) {
  const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
  if (!annotationLayerDiv) return;
  const maincontainer = document.createElement('div');
  maincontainer.className = 'annotation maindiv';
  maincontainer.style.left = `${x}px`;
  maincontainer.style.top = `${y}px`;
  const container = document.createElement('div');
  container.className = 'annotation text-annotation';
  container.contentEditable = true;
  container.style.fontFamily = fontFamilySelect.value;
  let fontFamilySelectvalue=12;
  if (window.matchMedia("(max-width: 768px)").matches) {
    console.log("Screen width is 768px or less");
    fontFamilySelectvalue=8;
} else {
    console.log("Screen width is greater than 768px");
    fontFamilySelectvalue=16;
}
  container.style.fontSize = `${   fontFamilySelectvalue  }px`;
  container.style.color = colorPicker.value;
  container.innerHTML = 'Click to edit text';

  const deleteWrapper = document.createElement('div');
  deleteWrapper.className = 'delete-wrapper';
  const deleteBtn = createDeleteButton();
  deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteAnnotation(maincontainer);
  });
  deleteWrapper.appendChild(deleteBtn);


  let isFirstClick = true;
  container.addEventListener('click', (e) => {
      if (isFirstClick || container.innerText === "Click to edit text") {
          container.innerText = '';
          isFirstClick = false;
      }
      container.focus();
      e.stopPropagation(); // Prevent click from triggering drag
  });

  container.addEventListener('keydown', () => {
      if (isFirstClick || container.innerText === "Click to edit text") {
          container.innerText = '';
          isFirstClick = false;
      }
  });

  container.addEventListener('focus', () => {
      activeTextAnnotation = container;
      textFormatToolbar.style.display = 'flex';
      deleteBtn.style.opacity = 1;
      positionFormatToolbar(container);
      updateToolbarState(container);
  });

  container.addEventListener('blur', (e) => {
      if (!e.relatedTarget || !textFormatToolbar.contains(e.relatedTarget)) {
          textFormatToolbar.style.display = 'none';
          deleteBtn.style.opacity = 0;
          if (container.textContent.trim() === '') {
              container.innerHTML = 'Click to edit text';
          }
          activeTextAnnotation = null;
      }
  });

  container.addEventListener('input', saveState);

  container.addEventListener('mousedown', (e) => e.stopPropagation());

////////////////drag

let isDragging = false;

let isTouchEditing = false;

let startX, startY, touchTimeout;



function startDrag(e) {

    if (e.target === container) {

        // Delay drag to detect single tap for editing

        isTouchEditing = true;

        touchTimeout = setTimeout(() => {

            isDragging = true;

            isTouchEditing = false;

            const touch = e.touches ? e.touches[0] : e;

            startX = touch.clientX - maincontainer.offsetLeft;

            startY = touch.clientY - maincontainer.offsetTop;

        }, 200); // 200ms delay to differentiate tap from drag

    }

    e.preventDefault();

}
function edit(e) {
  if (e.target === container) {
      // Allow text selection if clicking inside the text container
      return;
  }

  isDragging = true;
  const touch = e.touches ? e.touches[0] : e;
  startX = touch.clientX - maincontainer.offsetLeft;
  startY = touch.clientY - maincontainer.offsetTop;

  e.preventDefault();
}


function moveDrag(e) {

    if (!isDragging) return;

    isTouchEditing = false; // Cancel text editing on move

    const touch = e.touches ? e.touches[0] : e;

    let newX = touch.clientX - startX;

    let newY = touch.clientY - startY;

    const annotationLayerRect = annotationLayerDiv.getBoundingClientRect();

    const containerRect = container.getBoundingClientRect();

    if (newX < 0) newX = 0;

    if (newY < 0) newY = 0;

    if (newX + containerRect.width > annotationLayerRect.width)

        newX = annotationLayerRect.width - containerRect.width;

    if (newY + containerRect.height > annotationLayerRect.height)

        newY = annotationLayerRect.height - containerRect.height;

    maincontainer.style.left = `${newX}px`;

    maincontainer.style.top = `${newY}px`;

}



function stopDrag(e) {

    if (isTouchEditing) {

        clearTimeout(touchTimeout);

        container.focus(); // Enable text editing on tap

        isTouchEditing = false;

    }

    isDragging = false;

    saveState();

}



// Add event listeners for both mouse and touch

container.addEventListener('mousedown', startDrag);

document.addEventListener('mousemove', moveDrag);

document.addEventListener('mouseup', stopDrag);

container.addEventListener('touch', edit, { passive: false });

container.addEventListener('touchstart', startDrag, { passive: false });

document.addEventListener('touchmove', moveDrag, { passive: false });

document.addEventListener('touchend', stopDrag);


  maincontainer.appendChild(container);
  maincontainer.appendChild(deleteWrapper);
  annotationLayerDiv.appendChild(maincontainer);
  container.focus();
  saveState();
  currentTool = null;
  textTool.classList.remove("active");
  return maincontainer;
}
// Function to add tick mark annotation
function addTickMark(x, y, pageNumber) {
  console.log(x, y, pageNumber);
  
    const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
    const tick = document.createElement('div');
    tick.className = 'annotation tick-annotation';
    tick.style.left = x + 'px';
    tick.style.top = y + 'px';
    let fontFamilySelectvalue="2opx"
    if (window.matchMedia("(max-width: 768px)").matches) {
      console.log("Screen width is 768px or less");
      fontFamilySelectvalue=8;
  } else {
      console.log("Screen width is greater than 768px");
      fontFamilySelectvalue=20;
  }
    // Create tick mark using Font Awesome
    const tickMark = document.createElement('i');
    tickMark.className = 'fas fa-check';
    tickMark.style.color = '#3e3e3e'; // Bright green color
    tickMark.style.fontSize = `${fontFamilySelectvalue}px`;
    tick.appendChild(tickMark);

    // Create delete button
    const deleteBtn = createDeleteButton();
    tick.appendChild(deleteBtn);

    // Add to annotation layer
    annotationLayerDiv.appendChild(tick);
    makeDraggable(tick);
    currentTool = null;
    tickmarkTool.classList.remove("active");
    // Save state
    saveState();
}

// Delete annotation function
function deleteAnnotation(element) {
  // alert("delete");
    if (element.dragCleanup) {
        element.dragCleanup(); // Clean up drag event listeners
    }
    element.remove();
    saveState();
}

// Save current state for undo/redo
function saveState() {
    const state = Array.from(pagesContainer.children).map((pageWrapper) => {
        const pageNumber = parseInt(pageWrapper.getAttribute('data-page'));
        const annotationLayerDiv = pageWrapper.querySelector('.annotation-layer');
        return {
            pageNumber,
            annotations: annotationLayerDiv.innerHTML
        };
    });
    undoStack.push(state);
    redoStack = [];
    updateUndoRedoButtons();
}

// Update undo/redo buttons state
function updateUndoRedoButtons() {
  undoBtn.disabled = undoStack.length <= 1;
  redoBtn.disabled = redoStack.length === 0;
}

// Undo function
function undo() {
  if (undoStack.length <= 1) return;
  const currentState = undoStack.pop();
  redoStack.push(currentState);
  Array.from(pagesContainer.children).forEach((pageWrapper, index) => {
    const pageNumber = parseInt(pageWrapper.getAttribute('data-page'));
    const annotationLayerDiv = pageWrapper.querySelector('.annotation-layer');
    annotationLayerDiv.innerHTML = currentState[index].annotations;
  });
  updateUndoRedoButtons();
  reattachEventListeners();
}

// Redo function
function redo() {
  if (redoStack.length === 0) return;
  const nextState = redoStack.pop();
  undoStack.push(nextState);
  Array.from(pagesContainer.children).forEach((pageWrapper, index) => {
    const pageNumber = parseInt(pageWrapper.getAttribute('data-page'));
    const annotationLayerDiv = pageWrapper.querySelector('.annotation-layer');
    annotationLayerDiv.innerHTML = nextState[index].annotations;
  });
  updateUndoRedoButtons();
  reattachEventListeners();
}

// Reattach event listeners after undo/redo
function reattachEventListeners() {
  Array.from(pagesContainer.children).forEach((pageWrapper) => {
    const annotationLayerDiv = pageWrapper.querySelector('.annotation-layer');
    annotationLayerDiv.querySelectorAll(".annotation").forEach((annotation) => {
      makeDraggable(annotation);
      const deleteBtn = annotation.querySelector(".delete-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => deleteAnnotation(annotation));
      }
    });
  });
}

// Function to create delete button
function createDeleteButton() {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const annotation = e.target.parentElement;
        const annotationLayer = annotation.parentElement;
        
        if (!annotationLayer) {
            console.error('No annotation layer found');
            return;
        }
        
        // Add fade-out animation
        annotation.style.transition = 'opacity 0.3s ease';
        annotation.style.opacity = '0';
        
        // Remove after animation
        setTimeout(() => {
            if (annotationLayer.contains(annotation)) {
                annotationLayer.removeChild(annotation);
                saveState();
            }
        }, 300);
    });
    
    return deleteBtn;
}

function makeDraggable(element) {
  let isDragging = false;
  let currentX, currentY, initialX, initialY;

  element.addEventListener('mousedown', dragStart);
  element.addEventListener('touchstart', dragStart, { passive: false });

  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag, { passive: false });

  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchend', dragEnd);

  function dragStart(e) {
      let event = e.type === 'touchstart' ? e.touches[0] : e;

      if (element.contains(event.target)) {
          isDragging = true;
          initialX = event.clientX - element.offsetLeft;
          initialY = event.clientY - element.offsetTop;
          element.style.cursor = 'grabbing';
          // element.style.pointerEvents = 'none'; // Prevent selection issues
      }
  }

  function drag(e) {
      if (!isDragging) return;
      e.preventDefault();

      let event = e.type === 'touchmove' ? e.touches[0] : e;
      currentX = event.clientX - initialX;
      currentY = event.clientY - initialY;

      const annotationLayer = element.parentElement;
      const bounds = annotationLayer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // Constrain movement within parent boundaries
      if (currentX >= 0 && currentX + elementRect.width <= bounds.width) {
          element.style.left = `${currentX}px`;
      }
      if (currentY >= 0 && currentY + elementRect.height <= bounds.height) {
          element.style.top = `${currentY}px`;
      }
  }

  function dragEnd() {
      if (isDragging) {
          isDragging = false;
          element.style.cursor = 'grab';
          element.style.pointerEvents = 'auto'; // Restore pointer events
          
          saveState();
      }
  }
}

// // Function to make an element resizable
// function makeResizable(element) {
//     const handles = ['nw', 'ne', 'sw', 'se'];
//     let isResizing = false;
    
//     handles.forEach(handle => {
//         const resizer = document.createElement('div');
//         resizer.className = `resizer ${handle}`;
//         element.appendChild(resizer);
        
//         resizer.addEventListener('mousedown', initResize);
        
//         function initResize(e) {
//             e.stopPropagation();
//             isResizing = true;
            
//             const startX = e.clientX;
//             const startY = e.clientY;
//             const startWidth = parseInt(window.getComputedStyle(element).width);
//             const startHeight = parseInt(window.getComputedStyle(element).height);
//             const startLeft = parseInt(element.style.left);
//             const startTop = parseInt(element.style.top);
            
//             const resizeMove = (moveEvent) => {
//                 if (!isResizing) return;
//                 moveEvent.preventDefault();
                
//                 const deltaX = moveEvent.clientX - startX;
//                 const deltaY = moveEvent.clientY - startY;
                
//                 let newWidth = startWidth;
//                 let newHeight = startHeight;
//                 let newLeft = startLeft;
//                 let newTop = startTop;
                
//                 // Handle different resize corners
//                 switch(handle) {
//                     case 'nw':
//                         newWidth = startWidth - deltaX;
//                         newHeight = startHeight - deltaY;
//                         newLeft = startLeft + deltaX;
//                         newTop = startTop + deltaY;
//                         break;
//                     case 'ne':
//                         newWidth = startWidth + deltaX;
//                         newHeight = startHeight - deltaY;
//                         newTop = startTop + deltaY;
//                         break;
//                     case 'sw':
//                         newWidth = startWidth - deltaX;
//                         newHeight = startHeight + deltaY;
//                         newLeft = startLeft + deltaX;
//                         break;
//                     case 'se':
//                         newWidth = startWidth + deltaX;
//                         newHeight = startHeight + deltaY;
//                         break;
//                 }
                
//                 // Special handling for different annotation types
//                 if (element.classList.contains('round-annotation') || element.classList.contains('cross-annotation')) {
//                     // For round and cross annotations, maintain square shape
//                     const size = Math.max(Math.max(newWidth, newHeight), 20);
//                     newWidth = size;
//                     newHeight = size;
                    
//                     // For cross annotations, update lines
//                     if (element.classList.contains('cross-annotation')) {
//                         const lines = element.querySelectorAll('.cross-line');
//                         lines.forEach(line => {
//                             line.style.width = (size * 0.8) + 'px';
//                             line.style.left = (size * 0.1) + 'px';
//                             line.style.height = '3px';
//                         });
//                     }
//                 } else if (element.classList.contains('rectangle-annotation')) {
//                     // For rectangles, maintain minimum size but allow any aspect ratio
//                     newWidth = Math.max(newWidth, 20);
//                     newHeight = Math.max(newHeight, 20);
//                 }
                
//                 // Apply new dimensions and position
//                 element.style.width = newWidth + 'px';
//                 element.style.height = newHeight + 'px';
                
//                 // Update position based on handle
//                 if (handle.includes('w')) {
//                     element.style.left = newLeft + 'px';
//                 }
//                 if (handle.includes('n')) {
//                     element.style.top = newTop + 'px';
//                 }
//             };
            
//             const resizeEnd = () => {
//                 isResizing = false;
//                 document.removeEventListener('mousemove', resizeMove);
//                 document.removeEventListener('mouseup', resizeEnd);
//                 saveState();
//             };
            
//             document.addEventListener('mousemove', resizeMove);
//             document.addEventListener('mouseup', resizeEnd);
//         }
//     });
// }

// // Function to make an element resizable
// function makeResizable(element) {
//   const handles = ['nw', 'ne', 'sw', 'se'];
//   let isResizing = false;
  
//   handles.forEach(handle => {
//       const resizer = document.createElement('div');
//       resizer.className = `resizer ${handle}`;
//       element.appendChild(resizer);
      
//       // Mouse event handlers
//       resizer.addEventListener('mousedown', initResize);
//       // Touch event handlers
//       resizer.addEventListener('touchstart', initResize, { passive: false });
      
//       function initResize(e) {
//           e.stopPropagation();
//           isResizing = true;
          
//           // Get initial positions based on event type
//           const startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
//           const startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
//           const startWidth = parseInt(window.getComputedStyle(element).width);
//           const startHeight = parseInt(window.getComputedStyle(element).height);
//           const startLeft = parseInt(element.style.left);
//           const startTop = parseInt(element.style.top);
          
//           const resizeMove = (moveEvent) => {
//               if (!isResizing) return;
//               moveEvent.preventDefault();
              
//               // Get current position based on event type
//               const currentX = moveEvent.type === 'mousemove' ? moveEvent.clientX : moveEvent.touches[0].clientX;
//               const currentY = moveEvent.type === 'mousemove' ? moveEvent.clientY : moveEvent.touches[0].clientY;
              
//               const deltaX = currentX - startX;
//               const deltaY = currentY - startY;
              
//               let newWidth = startWidth;
//               let newHeight = startHeight;
//               let newLeft = startLeft;
//               let newTop = startTop;
              
//               // Handle different resize corners
//               switch(handle) {
//                   case 'nw':
//                       newWidth = startWidth - deltaX;
//                       newHeight = startHeight - deltaY;
//                       newLeft = startLeft + deltaX;
//                       newTop = startTop + deltaY;
//                       break;
//                   case 'ne':
//                       newWidth = startWidth + deltaX;
//                       newHeight = startHeight - deltaY;
//                       newTop = startTop + deltaY;
//                       break;
//                   case 'sw':
//                       newWidth = startWidth - deltaX;
//                       newHeight = startHeight + deltaY;
//                       newLeft = startLeft + deltaX;
//                       break;
//                   case 'se':
//                       newWidth = startWidth + deltaX;
//                       newHeight = startHeight + deltaY;
//                       break;
//               }
              
//               // Special handling for different annotation types
//               if (element.classList.contains('round-annotation') || element.classList.contains('cross-annotation')) {
//                   // For round and cross annotations, maintain square shape
//                   const size = Math.max(Math.max(newWidth, newHeight), 20);
//                   newWidth = size;
//                   newHeight = size;
                  
//                   // For cross annotations, update lines
//                   if (element.classList.contains('cross-annotation')) {
//                       const lines = element.querySelectorAll('.cross-line');
//                       lines.forEach(line => {
//                           line.style.width = (size * 0.8) + 'px';
//                           line.style.left = (size * 0.1) + 'px';
//                           line.style.height = '3px';
//                       });
//                   }
//               } else if (element.classList.contains('rectangle-annotation')) {
//                   // For rectangles, maintain minimum size but allow any aspect ratio
//                   newWidth = Math.max(newWidth, 20);
//                   newHeight = Math.max(newHeight, 20);
//               }
              
//               // Apply new dimensions and position
//               element.style.width = newWidth + 'px';
//               element.style.height = newHeight + 'px';
              
//               // Update position based on handle
//               if (handle.includes('w')) {
//                   element.style.left = newLeft + 'px';
//               }
//               if (handle.includes('n')) {
//                   element.style.top = newTop + 'px';
//               }
//           };
          
//           const resizeEnd = () => {
//               isResizing = false;
//               document.removeEventListener('mousemove', resizeMove);
//               document.removeEventListener('mouseup', resizeEnd);
//               document.removeEventListener('touchmove', resizeMove);
//               document.removeEventListener('touchend', resizeEnd);
//               saveState();
//           };
          
//           // Add both mouse and touch event listeners
//           document.addEventListener('mousemove', resizeMove);
//           document.addEventListener('mouseup', resizeEnd);
//           document.addEventListener('touchmove', resizeMove, { passive: false });
//           document.addEventListener('touchend', resizeEnd);
//       }
//   });
// }
// function makeResizable(element) {
//     const handles = ['nw', 'ne', 'sw', 'se'];
//     let isResizing = false;

//     handles.forEach(handle => {
//         const resizer = document.createElement('div');
//         resizer.className = `resizer ${handle}`;
//         element.appendChild(resizer);

//         // Mouse event handlers
//         resizer.addEventListener('mousedown', initResize);
//         // Touch event handlers
//         resizer.addEventListener('touchstart', initResize, { passive: false });

//         function initResize(e) {
//             e.stopPropagation();
//             isResizing = true;
//             const annotationLayerDiv = element.parentElement;
//             const annotationLayerRect = annotationLayerDiv.getBoundingClientRect();
//             const elementRect = element.getBoundingClientRect();

//             // Get initial positions
//             const startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
//             const startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
//             const startWidth = parseInt(window.getComputedStyle(element).width);
//             const startHeight = parseInt(window.getComputedStyle(element).height);
//             const startLeft = elementRect.left - annotationLayerRect.left;
//             const startTop = elementRect.top - annotationLayerRect.top;

//             const resizeMove = (moveEvent) => {
//                 if (!isResizing) return;
//                 moveEvent.preventDefault();

//                 const currentX = moveEvent.type === 'mousemove' ? moveEvent.clientX : moveEvent.touches[0].clientX;
//                 const currentY = moveEvent.type === 'mousemove' ? moveEvent.clientY : moveEvent.touches[0].clientY;

//                 const deltaX = currentX - startX;
//                 const deltaY = currentY - startY;

//                 let newWidth = startWidth;
//                 let newHeight = startHeight;
//                 let newLeft = startLeft;
//                 let newTop = startTop;

//                 // Handle different resize corners
//                 switch (handle) {
//                     case 'nw':
//                         newWidth = startWidth - deltaX;
//                         newHeight = startHeight - deltaY;
//                         newLeft = startLeft + deltaX;
//                         newTop = startTop + deltaY;
//                         break;
//                     case 'ne':
//                         newWidth = startWidth + deltaX;
//                         newHeight = startHeight - deltaY;
//                         newTop = startTop + deltaY;
//                         break;
//                     case 'sw':
//                         newWidth = startWidth - deltaX;
//                         newHeight = startHeight + deltaY;
//                         newLeft = startLeft + deltaX;
//                         break;
//                     case 'se':
//                         newWidth = startWidth + deltaX;
//                         newHeight = startHeight + deltaY;
//                         break;
//                 }

//                 // Ensure minimum size
//                 newWidth = Math.max(newWidth, 20);
//                 newHeight = Math.max(newHeight, 20);

//                 // Prevent resizing beyond annotation layer boundaries
//                 if (newLeft < 0) {
//                     newWidth += newLeft; // Adjust width to prevent overflow
//                     newLeft = 0;
//                 }
//                 if (newTop < 0) {
//                   newHeight = startHeight + startTop; // Limit height so top doesn't go outside
//                   newTop = 0;
//               }
//                 if (newLeft + newWidth > annotationLayerRect.width) {
//                     newWidth = annotationLayerRect.width - newLeft;
//                 }
//                 if (newTop + newHeight > annotationLayerRect.height) {
//                     newHeight = annotationLayerRect.height - newTop;
//                 }

//                 // Apply new dimensions and position
//                 element.style.width = newWidth + 'px';
//                 element.style.height = newHeight + 'px';

//                 if (handle.includes('w')) {
//                     element.style.left = newLeft + 'px';
//                 }
//                 if (handle.includes('n')) {
//                     element.style.top = newTop + 'px';
//                 }
//             };

//             const resizeEnd = () => {
//                 isResizing = false;
//                 document.removeEventListener('mousemove', resizeMove);
//                 document.removeEventListener('mouseup', resizeEnd);
//                 document.removeEventListener('touchmove', resizeMove);
//                 document.removeEventListener('touchend', resizeEnd);
//                 saveState();
//             };

//             document.addEventListener('mousemove', resizeMove);
//             document.addEventListener('mouseup', resizeEnd);
//             document.addEventListener('touchmove', resizeMove, { passive: false });
//             document.addEventListener('touchend', resizeEnd);
//         }
//     });
// }
 
//////////////////////----------2/1/2025
// function makeResizable(element) {
//   const handles = ['nw', 'ne', 'sw', 'se'];
//   let isResizing = false;

//   handles.forEach(handle => {
//       const resizer = document.createElement('div');
//       resizer.className = `resizer ${handle}`;
//       element.appendChild(resizer);

//       // Mouse event handlers
//       resizer.addEventListener('mousedown', initResize);
//       // Touch event handlers
//       resizer.addEventListener('touchstart', initResize, { passive: false });

//       function initResize(e) {
//           e.stopPropagation();
//           isResizing = true;
//           const annotationLayerDiv = element.parentElement;
//           const annotationLayerRect = annotationLayerDiv.getBoundingClientRect();
//           const elementRect = element.getBoundingClientRect();

//           // Get initial positions
//           const startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
//           const startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
//           const startWidth = parseInt(window.getComputedStyle(element).width);
//           const startHeight = parseInt(window.getComputedStyle(element).height);
//           const startLeft = elementRect.left - annotationLayerRect.left;
//           const startTop = elementRect.top - annotationLayerRect.top;

//           const resizeMove = (moveEvent) => {
//               if (!isResizing) return;
//               moveEvent.preventDefault();

//               const currentX = moveEvent.type === 'mousemove' ? moveEvent.clientX : moveEvent.touches[0].clientX;
//               const currentY = moveEvent.type === 'mousemove' ? moveEvent.clientY : moveEvent.touches[0].clientY;

//               const deltaX = currentX - startX;
//               const deltaY = currentY - startY;

//               let newWidth = startWidth;
//               let newHeight = startHeight;
//               let newLeft = startLeft;
//               let newTop = startTop;

//               // Handle different resize corners
//               switch (handle) {
//                   case 'nw':
//                       newWidth = startWidth - deltaX;
//                       newHeight = startHeight - deltaY;
//                       newLeft = startLeft + deltaX;
//                       newTop = startTop + deltaY;
//                       break;
//                   case 'ne':
//                       newWidth = startWidth + deltaX;
//                       newHeight = startHeight - deltaY;
//                       newTop = startTop + deltaY;
//                       break;
//                   case 'sw':
//                       newWidth = startWidth - deltaX;
//                       newHeight = startHeight + deltaY;
//                       newLeft = startLeft + deltaX;
//                       break;
//                   case 'se':
//                       newWidth = startWidth + deltaX;
//                       newHeight = startHeight + deltaY;
//                       break;
//               }

//               // Ensure minimum size
//               if (newWidth < 20) {
//                   newWidth = 20;
//                   if (handle.includes('w')) {
//                       newLeft = startLeft + (startWidth - newWidth);
//                   }
//               }
//               if (newHeight < 20) {
//                   newHeight = 20;
//                   if (handle.includes('n')) {
//                       newTop = startTop + (startHeight - newHeight);
//                   }
//               }

//               // Prevent resizing beyond annotation layer boundaries
//               if (newLeft < 0) {
//                   newLeft = 0;
//                   newWidth = startWidth + (startLeft - newLeft);
//               }
//               if (newTop < 0) {
//                   newTop = 0;
//                   newHeight = startHeight + (startTop - newTop);
//               }
//               if (newLeft + newWidth > annotationLayerRect.width) {
//                   newWidth = annotationLayerRect.width - newLeft;
//               }
//               if (newTop + newHeight > annotationLayerRect.height) {
//                   newHeight = annotationLayerRect.height - newTop;
//               }

//               // Apply new dimensions and position
//               element.style.width = newWidth + 'px';
//               element.style.height = newHeight + 'px';
//               if (handle.includes('w')) {
//                   element.style.left = newLeft + 'px';
//               }
//               if (handle.includes('n')) {
//                   element.style.top = newTop + 'px';
//               }
//           };

//           const resizeEnd = () => {
//               isResizing = false;
//               document.removeEventListener('mousemove', resizeMove);
//               document.removeEventListener('mouseup', resizeEnd);
//               document.removeEventListener('touchmove', resizeMove);
//               document.removeEventListener('touchend', resizeEnd);
//           };

//           document.addEventListener('mousemove', resizeMove);
//           document.addEventListener('mouseup', resizeEnd);
//           document.addEventListener('touchmove', resizeMove, { passive: false });
//           document.addEventListener('touchend', resizeEnd);
//       }
//   });
// }


////////////////////////-----------------
function makeResizable(element) {
  const handles = ['nw', 'ne', 'sw', 'se'];
  let isResizing = false;

  handles.forEach(handle => {
      const resizer = document.createElement('div');
      resizer.className = `resizer ${handle}`;
      element.appendChild(resizer);

      // Mouse event handlers
      resizer.addEventListener('mousedown', initResize);
      // Touch event handlers
      resizer.addEventListener('touchstart', initResize, { passive: false });

      function initResize(e) {
          e.stopPropagation();
          isResizing = true;
          const annotationLayerDiv = element.parentElement;
          const annotationLayerRect = annotationLayerDiv.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();

          // Get initial positions
          const startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
          const startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
          const startWidth = parseInt(window.getComputedStyle(element).width);
          const startHeight = parseInt(window.getComputedStyle(element).height);
          const startLeft = elementRect.left - annotationLayerRect.left;
          const startTop = elementRect.top - annotationLayerRect.top;

          // Calculate aspect ratio
          const aspectRatio = startWidth / startHeight;

          const resizeMove = (moveEvent) => {
              if (!isResizing) return;
              moveEvent.preventDefault();

              const currentX = moveEvent.type === 'mousemove' ? moveEvent.clientX : moveEvent.touches[0].clientX;
              const currentY = moveEvent.type === 'mousemove' ? moveEvent.clientY : moveEvent.touches[0].clientY;

              const deltaX = currentX - startX;
              const deltaY = currentY - startY;

              let newWidth = startWidth;
              let newHeight = startHeight;
              let newLeft = startLeft;
              let newTop = startTop;

              // Handle different resize corners
              switch (handle) {
                  case 'nw':
                      newWidth = startWidth - deltaX;
                      newHeight = newWidth / aspectRatio;
                      newLeft = startLeft + deltaX;
                      newTop = startTop + (startHeight - newHeight);
                      break;
                  case 'ne':
                      newWidth = startWidth + deltaX;
                      newHeight = newWidth / aspectRatio;
                      newTop = startTop + (startHeight - newHeight);
                      break;
                  case 'sw':
                      newWidth = startWidth - deltaX;
                      newHeight = newWidth / aspectRatio;
                      newLeft = startLeft + deltaX;
                      break;
                  case 'se':
                      newWidth = startWidth + deltaX;
                      newHeight = newWidth / aspectRatio;
                      break;
              }

              // Ensure minimum size
              if (newWidth < 20) {
                  newWidth = 20;
                  newHeight = newWidth / aspectRatio;
                  if (handle.includes('w')) {
                      newLeft = startLeft + (startWidth - newWidth);
                  }
              }
              if (newHeight < 20) {
                  newHeight = 20;
                  newWidth = newHeight * aspectRatio;
                  if (handle.includes('n')) {
                      newTop = startTop + (startHeight - newHeight);
                  }
              }

              // Prevent resizing beyond annotation layer boundaries
              if (newLeft < 0) {
                  newLeft = 0;
                  newWidth = startWidth + (startLeft - newLeft);
                  newHeight = newWidth / aspectRatio;
              }
              if (newTop < 0) {
                  newTop = 0;
                  newHeight = startHeight + (startTop - newTop);
                  newWidth = newHeight * aspectRatio;
              }
              if (newLeft + newWidth > annotationLayerRect.width) {
                  newWidth = annotationLayerRect.width - newLeft;
                  newHeight = newWidth / aspectRatio;
              }
              if (newTop + newHeight > annotationLayerRect.height) {
                  newHeight = annotationLayerRect.height - newTop;
                  newWidth = newHeight * aspectRatio;
              }

              // Apply new dimensions and position
              element.style.width = newWidth + 'px';
              element.style.height = newHeight + 'px';
              if (handle.includes('w')) {
                  element.style.left = newLeft + 'px';
              }
              if (handle.includes('n')) {
                  element.style.top = newTop + 'px';
              }
          };

          const resizeEnd = () => {
              isResizing = false;
              document.removeEventListener('mousemove', resizeMove);
              document.removeEventListener('mouseup', resizeEnd);
              document.removeEventListener('touchmove', resizeMove);
              document.removeEventListener('touchend', resizeEnd);
          };

          document.addEventListener('mousemove', resizeMove);
          document.addEventListener('mouseup', resizeEnd);
          document.addEventListener('touchmove', resizeMove, { passive: false });
          document.addEventListener('touchend', resizeEnd);
      }
  });
}



function addRoundAnnotation(x, y, pageNumber) {
    const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
    if (!annotationLayerDiv) return;

    const round = document.createElement('div');
    round.className = 'annotation round-annotation';
    round.style.left = x + 'px';
    round.style.top = y + 'px';
    round.setAttribute('data-page', pageNumber);
    
    // Add initial fade-in animation
    round.style.opacity = '0';
    round.style.transition = 'opacity 0.3s ease';

    // Create delete button
    const deleteBtn = createDeleteButton();
    round.appendChild(deleteBtn);

    // Make annotation draggable and resizable
    makeDraggable(round);
    makeResizable(round);

    // Add to annotation layer
    annotationLayerDiv.appendChild(round);
    
    // Trigger fade-in
    setTimeout(() => {
        round.style.opacity = '1';
    }, 50);
    currentTool = "";
    roundTool.classList.remove("active");
    saveState();
    return round;
}

// Function to add cross annotation
function addCrossAnnotation(x, y, pageNumber) {
  console.log("addCrossAnnotation2");
  
    const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
    if (!annotationLayerDiv) return;

    const cross = document.createElement('div');
    cross.className = 'annotation cross-annotation';
    cross.style.left = x + 'px';
    cross.style.top = y + 'px';
    cross.setAttribute('data-page', pageNumber);
    
    // Add initial fade-in animation
    cross.style.opacity = '0';
    cross.style.transition = 'opacity 0.3s ease';

    // Add cross lines
    const line1 = document.createElement('div');
    line1.className = 'cross-line';
    const line2 = document.createElement('div');
    line2.className = 'cross-line rotated';
    cross.appendChild(line1);
    cross.appendChild(line2);

    // Create delete button
    const deleteBtn = createDeleteButton();
    cross.appendChild(deleteBtn);

    // Make annotation draggable and resizable
    makeDraggable(cross);
    makeResizable(cross);

    // Add to annotation layer
    annotationLayerDiv.appendChild(cross);
    
    // Trigger fade-in
    setTimeout(() => {
        cross.style.opacity = '1';
    }, 50);
    
    saveState();
    currentTool = "";
    crossTool.classList.remove("active");
    return cross;
}

// Function to add rectangle annotation
function addRectangleAnnotation(x, y, pageNumber) {
  // alert ("Rectangle");
    const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
    if (!annotationLayerDiv) return;

    const rectangle = document.createElement('div');
    rectangle.className = 'annotation rectangle-annotation';
    rectangle.style.left = x + 'px';
    rectangle.style.top = y + 'px';
    rectangle.setAttribute('data-page', pageNumber);
    
    // Add initial fade-in animation
    rectangle.style.opacity = '0';
    rectangle.style.transition = 'opacity 0.3s ease';

    // Create delete button
    const deleteBtn = createDeleteButton();
    rectangle.appendChild(deleteBtn);

    // Make annotation draggable and resizable
    makeDraggable(rectangle);
    makeResizable(rectangle);

    // Add to annotation layer
    annotationLayerDiv.appendChild(rectangle);
    
    // Trigger fade-in
    setTimeout(() => {
        rectangle.style.opacity = '1';
    }, 50);
    
    saveState();
    currentTool = "";
    rectangleTool.classList.remove("active");
    return rectangle;
}

// Function to add image annotation
function addImageAnnotation(x, y, imageSrc, pageNumber) {
  alert ("Image");
    const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
    if (!annotationLayerDiv) return;

    console.log(`Adding image annotation on page ${pageNumber} at (${x}, ${y})`);
    
    // Create container
    const container = document.createElement('div');
    container.className = 'annotation-container image-container';
    container.style.position = 'absolute';
    container.style.left = x + 'px';
    container.style.top = y + 'px';
    container.setAttribute('data-page', pageNumber);
    
    // Create image element
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    container.appendChild(img);
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete image';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        container.remove();
        saveState();
    });

    // Create resize handle
    // const resizer = document.createElement('div');
    // resizer.className = 'resizer';
    // resizer.title = 'Drag to resize';

    // Create rotate button
    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'rotate-btn';
    rotateBtn.innerHTML = '↻';
    rotateBtn.title = 'Rotate image';
    let rotation = 0;
    rotateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        rotation = (rotation + 90) % 360;
        img.style.transform = `rotate(${rotation}deg)`;
        saveState();
    });

    // Add elements to container
    container.appendChild(img);
    container.appendChild(deleteBtn);
    container.appendChild(rotateBtn);
    // container.appendChild(resizer);

    // Make container draggable
    makeDraggable(container);
    makeResizable(container);

    // Add to annotation layer
    annotationLayerDiv.appendChild(container);
    saveState();
    currentTool = null;
    imageTool.classList.remove("active");
    return container;
}

// Image tool click handler
imageTool.addEventListener("click", () => {
  currentTool = "image";
  document.querySelectorAll(".tool-btn").forEach((btn) => btn.classList.remove("active"));
  imageTool.classList.add("active");
  showNotification("Click anywhere on the page to insert an image");
});

// Add click handler for pages container
pagesContainer.addEventListener('click', (e) => {
  if (currentTool === "image") {
    const annotationLayerDiv = e.target.closest('.annotation-layer');
    if (annotationLayerDiv) {
      const rect = annotationLayerDiv.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pageNumber = parseInt(annotationLayerDiv.getAttribute('data-page'));
      
      // Hide the notification when modal opens
      notification.style.display = 'none';
      
      // Show image modal and store click data
      imageModal.style.display = "block";
      imagePreview.style.display = "none";
      imageFile.value = "";
      imageModal.dataset.clickX = x;
      imageModal.dataset.clickY = y;
      imageModal.dataset.pageNumber = pageNumber;
    }
  } else if (currentTool === "signature") {
    const annotationLayerDiv = e.target.closest('.annotation-layer');
    if (annotationLayerDiv) {
      const rect = annotationLayerDiv.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pageNumber = parseInt(annotationLayerDiv.getAttribute('data-page'));
      
      // Hide the notification when modal opens
      notification.style.display = 'none';
      
      // Show signature modal and store click data
      signatureModal.style.display = "block";
      signatureModal.dataset.clickX = x;
      signatureModal.dataset.clickY = y;
      signatureModal.dataset.pageNumber = pageNumber;
      
      // Clear previous signature
      clearSignature();
    }
  }
});

// Image file selection handler
imageFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (event) => {
      imagePreview.src = event.target.result;
      imagePreview.style.display = "block";
      selectedImage = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

const imageFileInput = document.getElementById("imageFile");
const imageURLInput = document.getElementById("imageURL");
const loadImageURLBtn = document.getElementById("loadImageURL");
// const imagePreview = document.getElementById("imagePreview");
// const uploadImageBtn = document.getElementById("uploadImage");
// const imageModal = document.getElementById("imageModal");

// let selectedImage = null;

// Handle image file upload
imageFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedImage = e.target.result;
            imagePreview.src = selectedImage;
            imagePreview.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
});

// Handle image URL input
loadImageURLBtn.addEventListener("click", () => {
    const url = imageURLInput.value.trim();
    if (url) {
        selectedImage = url;
        imagePreview.src = selectedImage;
        imagePreview.style.display = "block";
    }
});

// Upload image button handler
uploadImageBtn.addEventListener("click", () => {
    if (selectedImage) {
        const x = parseFloat(imageModal.dataset.clickX);
        const y = parseFloat(imageModal.dataset.clickY);
        const pageNumber = parseInt(imageModal.dataset.pageNumber);
        
        addImageAnnotation(x, y, selectedImage, pageNumber);
        imageModal.style.display = "none";
        selectedImage = null;
    }
});

// Upload image button handler
// uploadImageBtn.addEventListener("click", () => {
//   if (selectedImage) {
//     const x = parseFloat(imageModal.dataset.clickX);
//     const y = parseFloat(imageModal.dataset.clickY);
//     const pageNumber = parseInt(imageModal.dataset.pageNumber);
    
//     addImageAnnotation(x, y, selectedImage, pageNumber);
//     imageModal.style.display = "none";
//     currentTool = null;
//     imageTool.classList.remove("active");
//     selectedImage = null;
//   }
// });

// Close image modal
closeImageBtn.addEventListener("click", () => {
  imageModal.style.display = "none";
  currentTool = null;
  selectedImage = null;
});

// Event handler to load the PDF from a third-party API and render it
async function fetchAndLoadPDF() {
  const pdfBlob = await downloadCertificate();
  if (pdfBlob) {
    await loadPDFFromBlob(pdfBlob);
  }
}

// Function to safely add event listener
function addSafeEventListener(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(eventType, handler);
    }
}

// Add event listeners safely
window.addEventListener('DOMContentLoaded', () => {
    // Tool event listeners
    addSafeEventListener('roundTool', 'click', () => currentTool = 'round');
    addSafeEventListener('crossTool', 'click', () => currentTool = 'cross');
    addSafeEventListener('rectangleTool', 'click', () => currentTool = 'rectangle');
    addSafeEventListener('tickmarkTool', 'click', () => currentTool = 'tick');
    
    // Clear all annotations
    addSafeEventListener('clearAll', 'click', () => {
        if (confirm('Are you sure you want to delete all annotations?')) {
            clearAllAnnotations();
        }
    });
    
    // Other event listeners
    addSafeEventListener('fetchAndLoadPDF', 'click', fetchAndLoadPDF);
    addSafeEventListener('undoBtn', 'click', undo);
    addSafeEventListener('redoBtn', 'click', redo);
    addSafeEventListener('savePDF', 'click', saveAnnotatedPDF);
    addSafeEventListener('uploadPDF', 'click', uploadAnnotatedPDF);

});

// Clear all annotations function
function clearAllAnnotations() {
    const annotationLayers = document.querySelectorAll('.annotation-layer');
    
    annotationLayers.forEach(layer => {
        const annotations = layer.querySelectorAll('.round-annotation, .cross-annotation, .rectangle-annotation');
        
        annotations.forEach(annotation => {
            // Add fade-out animation
            annotation.style.transition = 'opacity 0.3s ease';
            annotation.style.opacity = '0';
        });
        
        // Remove after animation
        setTimeout(() => {
            annotations.forEach(annotation => {
                if (annotation.parentElement) {
                    annotation.parentElement.removeChild(annotation);
                }
            });
            saveState();
        }, 300);
    });
}

// Event Listeners for tools
textTool.addEventListener("click", () => {
  currentTool = "text";
  document
    .querySelectorAll(".tool-btn")
    .forEach((btn) => btn.classList.remove("active"));
  textTool.classList.add("active");
});

signatureTool.addEventListener("click", () => {
  currentTool = "signature";
  document
    .querySelectorAll(".tool-btn")
    .forEach((btn) => btn.classList.remove("active"));
  signatureTool.classList.add("active");
  clearSignature();
  showNotification("Click anywhere on the page to add your signature");
});

imageTool.addEventListener("click", () => {
  currentTool = "image";
  document
    .querySelectorAll(".tool-btn")
    .forEach((btn) => btn.classList.remove("active"));
  imageTool.classList.add("active");
});

roundTool.addEventListener("click", () => {
  currentTool = "round";
  document
    .querySelectorAll(".tool-btn")
    .forEach((btn) => btn.classList.remove("active"));
  roundTool.classList.add("active");
});

crossTool.addEventListener("click", () => {
  currentTool = "cross";
  document
    .querySelectorAll(".tool-btn")
    .forEach((btn) => btn.classList.remove("active"));
  crossTool.classList.add("active");
});

rectangleTool.addEventListener("click", () => {
  currentTool = "rectangle";
  document
    .querySelectorAll(".tool-btn")
    .forEach((btn) => btn.classList.remove("active"));
  rectangleTool.classList.add("active");
});

// Click handler for PDF canvas area
document.querySelectorAll('.pdf-canvas').forEach((canvas) => {
  console.log('Canvas clicked');
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pageNumber = parseInt(canvas.getAttribute('data-page'));

    if (currentTool === "text") {
      addTextAnnotation(x, y, pageNumber);
    } else if (currentTool === "tick") {
      addTickMark(x, y, pageNumber);
    } else if (currentTool === "round") {
      addRoundAnnotation(x, y, pageNumber);
    } else if (currentTool === "cross") {
      addCrossAnnotation(x, y, pageNumber);
    } 
    else if (currentTool === "rectangle") {
      addRectangleAnnotation(x, y, pageNumber);
      
    }
  });
});

// // Click handler for annotation layer
// document.querySelectorAll('.annotation-layer').forEach((annotationLayerDiv) => {
//   annotationLayerDiv.addEventListener("click", (e) => {
//     console.log("currentTool");
//     console.log('Annotation layer clicked5');
//     if (e.target === annotationLayerDiv) {
//       const rect = annotationLayerDiv.getBoundingClientRect();
//       const x = e.clientX - rect.left;
//       const y = e.clientY - rect.top;
//       const pageNumber = parseInt(annotationLayerDiv.getAttribute('data-page'));

//       if (currentTool === "text") {
//         addTextAnnotation(x, y, pageNumber);
//       } else if (currentTool === "tick") {
//         console.log(currentTool);
        
//         addTickMark(x, y, pageNumber);
//       } else if (currentTool === "round") {
//         addRoundAnnotation(x, y, pageNumber);
//       } else if (currentTool === "cross") {
//         addCrossAnnotation(x, y, pageNumber);
//       } else if (currentTool === "rectangle") {
//         addRectangleAnnotation(x, y, pageNumber);
//       } else if (currentTool === "image" && selectedImage) {
//         imageModal.style.display = "block";
//         imagePreview.style.display = "none";
//         imageFile.value = "";
        
//         // Store click coordinates and page number for later use
//         imageModal.dataset.clickX = x;
//         imageModal.dataset.clickY = y;
//         imageModal.dataset.pageNumber = pageNumber;
//       }
//     }
//   });
// });

// Signature handling
signatureCanvas.width = 400;
signatureCanvas.height = 200;
signatureCtx.strokeStyle = "#000";
signatureCtx.lineWidth = 2;
signatureCtx.lineCap = "round";

// let isSignatureDrawing = false;
// let signatureX = 0, signatureY = 0;

// Common function to get the position of touch/mouse event
function getPosition(e) {
  const rect = signatureCanvas.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  } else {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}

// Mouse events
signatureCanvas.addEventListener("mousedown", (e) => {
  isSignatureDrawing = true;
  const pos = getPosition(e);
  signatureX = pos.x;
  signatureY = pos.y;
});

signatureCanvas.addEventListener("mousemove", (e) => {
  if (!isSignatureDrawing) return;
  const pos = getPosition(e);
  signatureCtx.beginPath();
  signatureCtx.moveTo(signatureX, signatureY);
  signatureCtx.lineTo(pos.x, pos.y);
  signatureCtx.stroke();
  signatureX = pos.x;
  signatureY = pos.y;
});

signatureCanvas.addEventListener("mouseup", () => {
  isSignatureDrawing = false;
});

signatureCanvas.addEventListener("mouseleave", () => {
  isSignatureDrawing = false;
});

// Touch events for mobile
signatureCanvas.addEventListener("touchstart", (e) => {
  e.preventDefault(); // Prevent scrolling
  isSignatureDrawing = true;
  const pos = getPosition(e);
  signatureX = pos.x;
  signatureY = pos.y;
});

signatureCanvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (!isSignatureDrawing) return;
  const pos = getPosition(e);
  signatureCtx.beginPath();
  signatureCtx.moveTo(signatureX, signatureY);
  signatureCtx.lineTo(pos.x, pos.y);
  signatureCtx.stroke();
  signatureX = pos.x;
  signatureY = pos.y;
});

signatureCanvas.addEventListener("touchend", () => {
  isSignatureDrawing = false;
});

signatureCanvas.addEventListener("touchcancel", () => {
  isSignatureDrawing = false;
});
// Clear signature canvas
function clearSignature() {
  signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
}

// Add signature to PDF
// function saveSignature() {
//   const dataURL = signatureCanvas.toDataURL();
//   const pageNumber = 1; // Default to first page
//   const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
//   const container = document.createElement("div");
//   container.className = "annotation signature-annotation";
//   container.style.left = "50%";
//   container.style.top = "50%";
//   container.style.transform = "translate(-50%, -50%)";

//   const img = document.createElement("img");
//   img.src = dataURL;
//   img.style.maxWidth = "200px";
//   img.draggable = false; // Prevent default image dragging

//   const deleteBtn = createDeleteButton();
//   deleteBtn.addEventListener("click", (e) => {
//     e.stopPropagation();
//     deleteAnnotation(container);
//   });

//   container.appendChild(deleteBtn);
//   container.appendChild(img);

//   // Prevent default drag behavior
//   container.addEventListener("dragstart", (e) => e.preventDefault());

//   makeDraggable(container);
//   annotationLayerDiv.appendChild(container);
//   signatureModal.style.display = "none";
//   clearSignature();
//   saveState();
// }

// Image handling
// Image tool click handler
imageTool.addEventListener("click", () => {
  currentTool = "image";
  document
    .querySelectorAll(".tool-btn")
    .forEach((btn) => btn.classList.remove("active"));
  imageTool.classList.add("active");
});

// Image file selection handler
imageFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (event) => {
      imagePreview.src = event.target.result;
      imagePreview.style.display = "block";
      selectedImage = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Close image modal
closeImageBtn.addEventListener("click", () => {
  imageModal.style.display = "none";
  currentTool = null;
  selectedImage = null;
});

// Upload image handler
uploadImageBtn.addEventListener("click", () => {
  if (selectedImage) {
    const x = parseFloat(imageModal.dataset.clickX);
    const y = parseFloat(imageModal.dataset.clickY);
    const pageNumber = parseInt(imageModal.dataset.pageNumber);
    
    addImageAnnotation(x, y, selectedImage, pageNumber);
    imageModal.style.display = "none";
    currentTool = null;
    imageTool.classList.remove("active");
    selectedImage = null;
  }
});

// Close signature modal
closeSignatureBtn.addEventListener("click", () => {
  signatureModal.style.display = "none";
  currentTool = null;
  signatureTool.classList.remove("active");
});

// Save signature button handler
saveSignatureBtn.addEventListener("click", () => {
  const x = parseFloat(signatureModal.dataset.clickX);
  const y = parseFloat(signatureModal.dataset.clickY);
  const pageNumber = parseInt(signatureModal.dataset.pageNumber);
  
  const dataURL = signatureCanvas.toDataURL();
  addSignatureAnnotation(x, y, dataURL, pageNumber);
  signatureModal.style.display = "none";
  currentTool = null;
  signatureTool.classList.remove("active");
  clearSignature();
});

// Function to add signature annotation
function addSignatureAnnotation(x, y, signatureDataURL, pageNumber) {
  const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
  if (!annotationLayerDiv) {
    console.error('Annotation layer not found');
    return;
  }

  const container = document.createElement('div');
  container.className = 'annotation-container signature-container';
  container.style.position = 'absolute';
  container.style.left = x + 'px';
  container.style.top = y + 'px';
  container.setAttribute('data-page', pageNumber);

  const img = document.createElement('img');
  img.src = signatureDataURL;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';
  container.appendChild(img);

  const deleteBtn = createDeleteButton();
  container.appendChild(deleteBtn);

  makeDraggable(container);
  makeResizable(container);

  annotationLayerDiv.appendChild(container);
  saveState();
}

// Asset drag and drop handling
assetItems.forEach(item => {
    item.addEventListener('dragstart', function(e) {
        const imageSrc = this.dataset.src;
        e.dataTransfer.setData('text/plain', imageSrc);
        e.dataTransfer.effectAllowed = 'copy';
        this.classList.add('dragging');
        console.log('Drag started:', imageSrc);
    });

    item.addEventListener('dragend', function(e) {
        this.classList.remove('dragging');
        console.log('Drag ended');
    });
});

// Annotation layer drag and drop
document.querySelectorAll('.annotation-layer').forEach(annotationLayerDiv => {
  annotationLayerDiv.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  annotationLayerDiv.addEventListener('drop', function(e) {
    e.preventDefault();
    const imageSrc = e.dataTransfer.getData('text/plain');
    console.log('Dropped image:', imageSrc);
    
    if (imageSrc ) {
      const rect = annotationLayerDiv.getBoundingClientRect();
      const x = e.clientX - rect.left - 50;
      const y = e.clientY - rect.top - 50;
      const pageNumber = parseInt(annotationLayerDiv.getAttribute('data-page'));
      addImageAnnotation(x, y, imageSrc, pageNumber);
      saveState();
    }
  });
});

// Function to add image annotation
function addImageAnnotation(x, y, imageSrc, pageNumber) {
  // alert("Image");
    console.log(imageSrc);
    
    // Create container
    const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
    const container = document.createElement('div');
    container.className = 'annotation-container image-container';
    container.style.position = 'absolute';
    container.style.left = x + 'px';
    container.style.top = y + 'px';

    // Create image element
    const img = document.createElement('img');
    if (imageSrc.startsWith("http")) {
      // Convert remote image to data URL
      fetchImageAsDataURL(imageSrc).then(dataUrl => {
          img.src = dataUrl;
          saveState();
      }).catch(error => {
          console.error("Error loading remote image:", error);
      });
  } else {
      img.src = imageSrc; // Local file upload (already a data URL)
  }
    // img.src = imageSrc;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    container.appendChild(img);
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete image';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        container.remove();
        saveState();
    });

    // Create resize handle
    // const resizer = document.createElement('div');
    // resizer.className = 'resizer';
    // resizer.title = 'Drag to resize';

    // Create rotate button
    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'rotate-btn';
    rotateBtn.innerHTML = '↻';
    rotateBtn.title = 'Rotate image';
    let rotation = 0;
    rotateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        rotation = (rotation + 90) % 360;
        img.style.transform = `rotate(${rotation}deg)`;
        saveState();
    });

    // Add elements to container
    container.appendChild(img);
    container.appendChild(deleteBtn);
    container.appendChild(rotateBtn);
    // container.appendChild(resizer);

    // Make container draggable
    makeDraggable(container);
    makeResizable(container);

    // Add to annotation layer
    annotationLayerDiv.appendChild(container);
    saveState();
    currentTool = null;
    imageTool.classList.remove("active");
    return container;
}
// function fetchImageAsDataURL(imageUrl) {
//   const proxyUrl = "https://cors-anywhere.herokuapp.com/"; // CORS Proxy
//   return new Promise((resolve, reject) => {
//       fetch(proxyUrl + imageUrl)
//           .then(response => response.blob())
//           .then(blob => {
//               const reader = new FileReader();
//               reader.onloadend = () => resolve(reader.result);
//               reader.onerror = reject;
//               reader.readAsDataURL(blob);
//           })
//           .catch(reject);
//   });
// }

function fetchImageAsDataURL(imageUrl) {
  return new Promise((resolve, reject) => {
      fetch(imageUrl)
          .then(response => response.blob())
          .then(blob => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
          })
          .catch(reject);
  });
}

// Function to add round annotation
function addRoundAnnotation(x, y, pageNumber) {
    const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
    if (!annotationLayerDiv) return;

    const round = document.createElement('div');
    round.className = 'annotation round-annotation';
    round.style.left = x + 'px';
    round.style.top = y + 'px';
    round.setAttribute('data-page', pageNumber);
    
    // Add initial fade-in animation
    round.style.opacity = '0';
    round.style.transition = 'opacity 0.3s ease';

    // Create delete button
    const deleteBtn = createDeleteButton();
    round.appendChild(deleteBtn);

    // Make annotation draggable and resizable
    makeDraggable(round);
    makeResizable(round);

    // Add to annotation layer
    annotationLayerDiv.appendChild(round);
    
    // Trigger fade-in
    setTimeout(() => {
        round.style.opacity = '1';
    }, 50);
    currentTool = "";
    roundTool.classList.remove("active");
    saveState();
    return round;
}

// Function to add cross annotation
function addCrossAnnotation(x, y, pageNumber) {
    const annotationLayerDiv = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
    if (!annotationLayerDiv) return;

    const cross = document.createElement('div');
    cross.className = 'annotation cross-annotation';
    cross.style.left = x + 'px';
    cross.style.top = y + 'px';
    cross.setAttribute('data-page', pageNumber);
    
    // Add initial fade-in animation
    cross.style.opacity = '0';
    cross.style.transition = 'opacity 0.3s ease';

    // Add cross lines
    const line1 = document.createElement('div');
    line1.className = 'cross-line';
    const line2 = document.createElement('div');
    line2.className = 'cross-line rotated';
    cross.appendChild(line1);
    cross.appendChild(line2);

    // Create delete button
    const deleteBtn = createDeleteButton();
    cross.appendChild(deleteBtn);

    // Make annotation draggable and resizable
    makeDraggable(cross);
    makeResizable(cross);

    // Add to annotation layer
    annotationLayerDiv.appendChild(cross);
    
    // Trigger fade-in
    setTimeout(() => {
        cross.style.opacity = '1';
    }, 50);
    
    saveState();
    currentTool = "";
    crossTool.classList.remove("active");
    return cross;
}

// PDF handling functions
async function loadPDF(file) {
  if (!file || file.type !== "application/pdf") {
    alert("Please select a valid PDF file.");
    return;
  }

  try {
    document.body.style.cursor = "wait";
    const reader = new FileReader();

    const pdfData = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    if (currentPDF) {
      await currentPDF.destroy();
      currentPDF = null;
    }

    currentPDF = await pdfjsLib.getDocument(pdfData).promise;
    annotationLayer.innerHTML = "";
    await renderPage(1);
  } catch (error) {
    console.error("Error loading PDF:", error);
    alert("Error loading PDF. Please try again.");
  } finally {
    document.body.style.cursor = "default";
  }
}

// Undo/Redo handlers
undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

// Clear all annotations
// clearAllBtn.addEventListener("click", () => {
//   if (confirm("Are you sure you want to clear all annotations?")) {
//     Array.from(pagesContainer.children).forEach((pageWrapper) => {
//       const annotationLayerDiv = pageWrapper.querySelector('.annotation-layer');
//       annotationLayerDiv.innerHTML = "";
//     });
//     saveState();
//   }
// });

// Function to save annotated PDF
async function saveAnnotatedPDF() {
    try {
        console.log("Starting PDF export...");
        if (!currentPDF) {
            console.error("No PDF loaded");
            alert("Please load a PDF first");
            return;
        }

        // Show loading state
        document.body.style.cursor = 'wait';
        const saveBtn = document.getElementById('savePDF');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;

        // Create a new jsPDF instance
        const pdf = new window.jsPDF();
        
        // Process each page
        const pages = Array.from(pagesContainer.children);
        console.log(`Processing ${pages.length} pages...`);

        for (let i = 0; i < pages.length; i++) {
            const pageWrapper = pages[i];
            const pageNumber = parseInt(pageWrapper.getAttribute('data-page'));
            console.log(`Processing page ${pageNumber}`);

            // If not first page, add a new page to PDF
            if (i > 0) {
                pdf.addPage();
            }

            // Get the canvas and annotation layer for this page
            const canvas = pageWrapper.querySelector('.pdf-canvas');
            const annotationLayer = pageWrapper.querySelector('.annotation-layer');

            // First, draw the PDF page
            const pageCanvas = document.createElement('canvas');
            const context = pageCanvas.getContext('2d');
            pageCanvas.width = canvas.width;
            pageCanvas.height = canvas.height;

            // Draw the PDF page from the original canvas
            context.drawImage(canvas, 0, 0);

            // Use html2canvas to capture annotations
            // const annotationCanvas = await html2canvas(annotationLayer, {
            //     backgroundColor: null,
            //     scale: 1,
            //     logging: false,
            //     width: canvas.width,
            //     height: canvas.height
            // });
            const scaleFactor = window.devicePixelRatio || 1;
            const annotationCanvas = await html2canvas(annotationLayer, {
                backgroundColor: null,
                scale: scaleFactor,  // Ensure scaling matches high-res screens
                width: annotationLayer.offsetWidth * scaleFactor,
                height: annotationLayer.offsetHeight * scaleFactor,
            });
            
            // Draw annotations on top of the PDF
            context.drawImage(annotationCanvas, 0, 0);

            // Add the combined image to the PDF
            const imgData = pageCanvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            console.log(pdfWidth,pdfHeight)
            console.log(imgProps.width,imgProps.height)
            const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
            console.log(ratio)
            const imgWidth = imgProps.width * ratio;
            const imgHeight = imgProps.height * ratio;
            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;
console.log( x, y, imgWidth, imgHeight)
            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            console.log(`Added page ${pageNumber} to PDF`);
        }
     
 
        // Save the PDF
        const filename ='annotated_document-'+CrtNo+'.pdf';
        pdf.save(filename);
        console.log("PDF saved successfully");

        // Reset button state
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        document.body.style.cursor = 'default';

    } catch (error) {
        console.error("Error saving PDF:", error);
        alert("Error saving PDF. Please try again.");
        document.body.style.cursor = 'default';
        const saveBtn = document.getElementById('savePDF');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save PDF';
        saveBtn.disabled = false;
    }
}
/////////////////high quality
async function uploadAnnotatedPDF() {
  try {
      console.log("Starting PDF export...");
      if (!currentPDF) {
          console.error("No PDF loaded");
          alert("Please load a PDF first");
          return;
      }

      // Show loading state
      document.body.style.cursor = 'wait';
      const saveBtn = document.getElementById('uploadPDF');
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
      saveBtn.disabled = true;

      // Create a new jsPDF instance
      // const pdf = new window.jsPDF();
      const pdf = new window.jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true // Enables built-in compression
      });
      // Process each page
      const pages = Array.from(pagesContainer.children);
      console.log(`Processing ${pages.length} pages...`);

      for (let i = 0; i < pages.length; i++) {
          const pageWrapper = pages[i];
          const pageNumber = parseInt(pageWrapper.getAttribute('data-page'));
          console.log(`Processing page ${pageNumber}`);

          // If not first page, add a new page to PDF
          if (i > 0) {
              pdf.addPage();
          }

          // Get the canvas and annotation layer for this page
          const canvas = pageWrapper.querySelector('.pdf-canvas');
          const annotationLayer = pageWrapper.querySelector('.annotation-layer');

          // First, draw the PDF page
          const pageCanvas = document.createElement('canvas');
          const context = pageCanvas.getContext('2d');
          pageCanvas.width = canvas.width;
          pageCanvas.height = canvas.height;

          // Draw the PDF page from the original canvas
          context.drawImage(canvas, 0, 0);

          // Use html2canvas to capture annotations
          const scaleFactor = window.devicePixelRatio || 1;
          const annotationCanvas = await html2canvas(annotationLayer, {
              backgroundColor: null,
              scale: scaleFactor,  // Ensure scaling matches high-res screens
              width: annotationLayer.offsetWidth * scaleFactor,
              height: annotationLayer.offsetHeight * scaleFactor,
          });
          
          // Draw annotations on top of the PDF
          context.drawImage(annotationCanvas, 0, 0);

          // Add the combined image to the PDF
          const imgData = pageCanvas.toDataURL('image/png');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgProps = pdf.getImageProperties(imgData);
          const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
          const imgWidth = imgProps.width * ratio;
          const imgHeight = imgProps.height * ratio;
          const x = (pdfWidth - imgWidth) / 2;
          const y = (pdfHeight - imgHeight) / 2;

          pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
          console.log(`Added page ${pageNumber} to PDF`);
      }

      // Convert PDF to Blob (file data)
      const pdfBlob = pdf.output('blob');

      // Create FormData to send with the request
      const formData = new FormData();
      formData.append('recordId', id); // Your record ID
      
      formData.append('filePath', pdfBlob, 'annotated_document-'+CrtNo+'.pdf'); // Append PDF Blob

      // Upload the file to the server
      const response = await fetch('https://mcb.medicalcertificate.in/upload', {
          method: 'POST',
          body: formData,
      });

      // Check if the upload was successful
      if (response.ok) {
          console.log("PDF uploaded successfully");
          alert("PDF uploaded successfully");
      } else {
          console.error("Error uploading PDF");
          alert("Error uploading PDF. Please try again.");
      }

      // Reset button state
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
      document.body.style.cursor = 'default';

  } catch (error) {
      console.error("Error saving or uploading PDF:", error);
      alert("Error saving or uploading PDF. Please try again.");
      document.body.style.cursor = 'default';
      const saveBtn = document.getElementById('uploadPDF');
      saveBtn.innerHTML = '<i class="fas fa-upload"></i>';
      saveBtn.disabled = false;
  }
}
/////////////////////----------low quality
// async function uploadAnnotatedPDF() {
//   try {
//       console.log("Starting PDF export...");
//       if (!currentPDF) {
//           console.error("No PDF loaded");
//           alert("Please load a PDF first");
//           return;
//       }

//       // Show loading state
//       document.body.style.cursor = 'wait';
//       const saveBtn = document.getElementById('uploadPDF');
//       const originalText = saveBtn.innerHTML;
//       saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
//       saveBtn.disabled = true;

//       // Create a new jsPDF instance with compression enabled
//       const pdf = new window.jsPDF({
//           orientation: 'portrait',
//           unit: 'mm',
//           format: 'a4',
//           compress: true // Enables built-in compression
//       });

//       // Process each page
//       const pages = Array.from(pagesContainer.children);
//       console.log(`Processing ${pages.length} pages...`);

//       for (let i = 0; i < pages.length; i++) {
//           const pageWrapper = pages[i];
//           const pageNumber = parseInt(pageWrapper.getAttribute('data-page'));
//           console.log(`Processing page ${pageNumber}`);

//           if (i > 0) {
//               pdf.addPage();
//           }

//           // Get the canvas and annotation layer for this page
//           const canvas = pageWrapper.querySelector('.pdf-canvas');
//           const annotationLayer = pageWrapper.querySelector('.annotation-layer');

//           // Create a new canvas to combine PDF content and annotations
//           const pageCanvas = document.createElement('canvas');
//           const context = pageCanvas.getContext('2d');
          
//           // Reduce canvas size to match PDF dimensions
//           const scale = 0.5; // Adjust scale factor for better compression
//           pageCanvas.width = canvas.width * scale;
//           pageCanvas.height = canvas.height * scale;
//           context.scale(scale, scale);

//           // Draw the PDF page from the original canvas
//           context.drawImage(canvas, 0, 0);

//           // Capture annotations using html2canvas with reduced scale
//           const annotationCanvas = await html2canvas(annotationLayer, {
//               backgroundColor: null,
//               scale: 1, // Reduce scale to avoid oversized images
//           });

//           // Draw annotations on top of the PDF page
//           context.drawImage(annotationCanvas, 0, 0, annotationCanvas.width * scale, annotationCanvas.height * scale);

//           // Convert the combined image to JPEG format with compression
//           const imgData = pageCanvas.toDataURL('image/jpeg', 0.7); // JPEG with 70% quality

//           // Calculate dimensions for PDF placement
//           const pdfWidth = pdf.internal.pageSize.getWidth();
//           const pdfHeight = pdf.internal.pageSize.getHeight();
//           const imgProps = pdf.getImageProperties(imgData);
//           const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
//           const imgWidth = imgProps.width * ratio;
//           const imgHeight = imgProps.height * ratio;
//           const x = (pdfWidth - imgWidth) / 2;
//           const y = (pdfHeight - imgHeight) / 2;

//           // Add optimized image to PDF
//           pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
//           console.log(`Added page ${pageNumber} to PDF`);
//       }

//       // Convert PDF to Blob (file data)
//       const pdfBlob = pdf.output('blob');

//       // Create FormData to send with the request
//       const formData = new FormData();
//       formData.append('recordId', id); // Your record ID
//       formData.append('filePath', pdfBlob, `annotated_document-${CrtNo}.pdf`); // Append PDF Blob

//       // Upload the file to the server
//       const response = await fetch('https://mcb.medicalcertificate.in/upload', {
//           method: 'POST',
//           body: formData,
//       });

//       // Check if the upload was successful
//       if (response.ok) {
//           console.log("PDF uploaded successfully");
//           alert("PDF uploaded successfully");
//       } else {
//           console.error("Error uploading PDF");
//           alert("Error uploading PDF. Please try again.");
//       }

//       // Reset button state
//       saveBtn.innerHTML = originalText;
//       saveBtn.disabled = false;
//       document.body.style.cursor = 'default';

//   } catch (error) {
//       console.error("Error saving or uploading PDF:", error);
//       alert("Error saving or uploading PDF. Please try again.");
//       document.body.style.cursor = 'default';
//       const saveBtn = document.getElementById('uploadPDF');
//       saveBtn.innerHTML = '<i class="fas fa-upload"></i>';
//       saveBtn.disabled = false;
//   }
// }


// Add event listener for save button
uploadPDFBtn.addEventListener('click', uploadAnnotatedPDF);
savePDFBtn.addEventListener('click', saveAnnotatedPDF);

// Signature modal handlers
clearSignatureBtn.addEventListener("click", clearSignature);

saveSignatureBtn.addEventListener("click", saveSignature);

closeSignatureBtn.addEventListener("click", () => {
  signatureModal.style.display = "none";
});

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === signatureModal) {
    signatureModal.style.display = "none";
  }

});

// // Preview PDF button handler
// previewPDFBtn.addEventListener('click', async () => {
//     try {
//         showNotification("Generating preview...");
//         previewModal.style.display = "block";
//         previewContainer.innerHTML = ''; // Clear previous preview
//         previewContainer.style.transform = `scale(1)`;;
        
//         // Get all pages and their content
//         const pages = document.querySelectorAll('.page-wrapper');
//         console.log(pages);
        
//         for (let i = 0; i < pages.length; i++) {
//             const originalPage = pages[i];
//             const pageNumber = i + 1;
            
//             // Create preview page container
//             const previewPage = document.createElement('div');
//             previewPage.className = 'page';
//             previewPage.style.width = originalPage.style.width;
//             previewPage.style.height = originalPage.style.height;
            
//             // Clone the canvas (PDF content)
//             const originalCanvas = originalPage.querySelector('canvas');
//             if (originalCanvas) {
//                 const canvas = document.createElement('canvas');
//                 canvas.width = originalCanvas.width;
//                 canvas.height = originalCanvas.height;
//                 const ctx = canvas.getContext('2d');
//                 ctx.drawImage(originalCanvas, 0, 0);
//                 previewPage.appendChild(canvas);
//             }
            
//             // Clone annotation layer
//             const originalAnnotationLayer = originalPage.querySelector('.annotation-layer');
//             if (originalAnnotationLayer) {
//                 const annotationLayer = originalAnnotationLayer.cloneNode(true);
                
//                 // Remove interactive elements from annotations
//                 annotationLayer.querySelectorAll('.delete-btn, .rotate-btn, .resizer').forEach(el => {
//                     el.remove();
//                 });
                
//                 // Make annotations non-interactive
//                 annotationLayer.querySelectorAll('.annotation-container').forEach(annotation => {
//                     annotation.style.cursor = 'default';
//                     annotation.style.pointerEvents = 'none';
//                 });
                
//                 previewPage.appendChild(annotationLayer);
//             }
            
//             previewContainer.appendChild(previewPage);
//         }
        
       
        
//     } catch (error) {
//         console.error('Preview generation failed:', error);
//         showNotification("Failed to generate preview", 3000);
//     }
// });
// Function to copy computed styles
// function copyComputedStyles(sourceElement, targetElement) {
//   const computedStyle = window.getComputedStyle(sourceElement);
//   for (let i = 0; i < computedStyle.length; i++) {
//       const prop = computedStyle[i];
//       targetElement.style[prop] = computedStyle.getPropertyValue(prop);
//   }
// }

// // Preview PDF button handler
// previewPDFBtn.addEventListener('click', async () => {
//   try {
//       showNotification("Generating preview...");
//       previewModal.style.display = "block";
//       previewContainer.innerHTML = ''; // Clear previous preview
//       previewContainer.style.transform = `scale(1)`;

//       // Get all pages and their content
//       const pages = Array.from(document.querySelectorAll('.page-wrapper'));

//       console.log(`Processing ${pages.length} pages for preview...`);

//       for (let i = 0; i < pages.length; i++) {
//           const pageWrapper = pages[i];

//           // Create preview page container
//           const previewPage = document.createElement('div');
//           previewPage.className = 'page';
//           previewPage.style.width = pageWrapper.style.width;
//           previewPage.style.height = pageWrapper.style.height;
//           previewPage.style.position = 'relative'; // Ensure correct positioning context

//           // Clone the canvas (PDF content)
//           const originalCanvas = pageWrapper.querySelector('.pdf-canvas');
//           if (originalCanvas) {
//               const canvas = document.createElement('canvas');
//               canvas.width = originalCanvas.width;
//               canvas.height = originalCanvas.height;
//               const ctx = canvas.getContext('2d');
//               ctx.drawImage(originalCanvas, 0, 0);
//               previewPage.appendChild(canvas);
//           }

//           // Clone annotation layer using html2canvas
//           const originalAnnotationLayer = pageWrapper.querySelector('.annotation-layer');
//           if (originalAnnotationLayer) {
//               const scaleFactor = window.devicePixelRatio || 1;
//               const annotationCanvas = await html2canvas(originalAnnotationLayer, {
//                   backgroundColor: null,
//                   scale: scaleFactor,
//                   width: originalAnnotationLayer.offsetWidth * scaleFactor,
//                   height: originalAnnotationLayer.offsetHeight * scaleFactor,
//               });

//               // Create an annotation image element
//               const annotationImg = document.createElement('img');
//               annotationImg.src = annotationCanvas.toDataURL('image/png');
//               annotationImg.style.position = 'absolute';
//               annotationImg.style.top = '0';
//               annotationImg.style.left = '0';
//               annotationImg.style.width = '100%';
//               annotationImg.style.height = '100%';

//               previewPage.appendChild(annotationImg);
//           }

//           previewContainer.appendChild(previewPage);
//           console.log(`Preview page ${i + 1} generated.`);
//       }

//   } catch (error) {
//       console.error('Preview generation failed:', error);
//       showNotification("Failed to generate preview", 3000);
//   }
// });
// Preview PDF button handler
// previewPDFBtn.addEventListener('click', async () => {
//   try {
//       showNotification("Generating preview...");
//       previewModal.style.display = "block";
//       previewContainer.innerHTML = ''; // Clear previous preview
//       previewContainer.style.transform = `scale(1)`;;
      
//       // Get all pages and their content
//       const pages = document.querySelectorAll('.page-wrapper');
//       console.log(pages);
      
//       for (let i = 0; i < pages.length; i++) {
//           const originalPage = pages[i];
//           const pageNumber = i + 1;
          
//           // Create preview page container
//           const previewPage = document.createElement('div');
//           previewPage.className = 'page';
//           previewPage.style.width = originalPage.style.width;
//           previewPage.style.height = originalPage.style.height;
          
//           // Clone the canvas (PDF content)
//           const originalCanvas = originalPage.querySelector('canvas');
//           if (originalCanvas) {
//               const canvas = document.createElement('canvas');
//               canvas.width = originalCanvas.width;
//               canvas.height = originalCanvas.height;
//               const ctx = canvas.getContext('2d');
//               ctx.drawImage(originalCanvas, 0, 0);
//               previewPage.appendChild(canvas);
//           }
          
//           // Clone annotation layer
//           const originalAnnotationLayer = originalPage.querySelector('.annotation-layer');
//           if (originalAnnotationLayer) {
//               const annotationLayer = originalAnnotationLayer.cloneNode(true);
              
//               // Remove interactive elements from annotations
//               annotationLayer.querySelectorAll('.delete-btn, .rotate-btn, .resizer').forEach(el => {
//                   el.remove();
//               });
              
//               // Make annotations non-interactive
//               annotationLayer.querySelectorAll('.annotation-container').forEach(annotation => {
//                   annotation.style.cursor = 'default';
//                   annotation.style.pointerEvents = 'none';
//               });
              
//               previewPage.appendChild(annotationLayer);
//           }
          
//           previewContainer.appendChild(previewPage);
//       }
      
     
      
//   } catch (error) {
//       console.error('Preview generation failed:', error);
//       showNotification("Failed to generate preview", 3000);
//   }
// });
// Preview PDF button handler
previewPDFBtn.addEventListener('click', async () => {
  try {
      showNotification("Generating preview...",1000);
      previewModal.style.display = "block";
      previewContainer.innerHTML = ''; // Clear previous preview
      previewContainer.style.transform = `scale(1)`;

      if (!currentPDF) {
          console.error('No PDF loaded');
          showNotification("No PDF loaded", 3000);
          return;
      }

      const numPages = currentPDF.numPages;

      for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
          const page = await currentPDF.getPage(pageNumber);
          const scale = await handleResponsivePDF();
          const viewport = page.getViewport({ scale });

          const dpr = window.devicePixelRatio || 1;

          // Create preview page container
          const previewPage = document.createElement('div');
          previewPage.className = 'page';
          previewPage.style.width = `${viewport.width}px`;
          previewPage.style.height = `${viewport.height}px`;

          // Create canvas for preview
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.scale(dpr, dpr);

          // Render PDF page onto the preview canvas
          await page.render({ canvasContext: ctx, viewport }).promise;
          previewPage.appendChild(canvas);

          // Clone and clean up annotation layer
          const originalAnnotationLayer = document.querySelector(`.annotation-layer[data-page="${pageNumber}"]`);
          if (originalAnnotationLayer) {
              const annotationLayer = originalAnnotationLayer.cloneNode(true);

              // Remove interactive elements
              annotationLayer.querySelectorAll('.delete-btn, .rotate-btn, .resizer').forEach(el => el.remove());

              // Make annotations non-interactive
              annotationLayer.querySelectorAll('.annotation-container').forEach(annotation => {
                  annotation.style.cursor = 'default';
                  annotation.style.pointerEvents = 'none';
              });

              previewPage.appendChild(annotationLayer);
          }

          previewContainer.appendChild(previewPage);
      }

  } catch (error) {
      console.error('Preview generation failed:', error);
      showNotification("Failed to generate preview", 3000);
  }
});


// Close preview modal
closePreviewBtn.addEventListener('click', () => {
    previewModal.style.display = "none";
});

// Close preview modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === previewModal) {
        previewModal.style.display = "none";
    }
});

// Zoom controls
function updateZoomLevel() {
    zoomLevelSpan.textContent = `${currentZoom}%`;
    console.log(currentZoom);
    
    console.log(currentZoom/100);
    
    previewContainer.style.transform = `scale(${Math.round(currentZoom/100 * 100) / 100})`;
    previewContainer.style.transformOrigin = 'top center';
}

zoomInBtn.addEventListener('click', () => {
    if (currentZoom < MAX_ZOOM) {
        currentZoom += ZOOM_STEP;
        updateZoomLevel();
    }
});

zoomOutBtn.addEventListener('click', () => {
    if (currentZoom > MIN_ZOOM) {
        currentZoom -= ZOOM_STEP;
        updateZoomLevel();
    }
});

function fitToWidth() {
    const container = previewContainer;
    const page = container.querySelector('.page');
    if (!page) return;
    
    const containerWidth = container.clientWidth - 40; // Account for padding
    const pageWidth = page.scrollWidth;
    const scale = (containerWidth / pageWidth) * 100;
    
    currentZoom = Math.min(Math.max(scale, MIN_ZOOM), MAX_ZOOM);
    updateZoomLevel();
}

fitWidthBtn.addEventListener('click', fitToWidth);

// Window resize handler for fit to width
// Function to handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(async () => {
        const scale = await handleResponsivePDF();
        // updatePDFDisplay(scale);
    }, 250);

    
});

// Function to position the format toolbar near text annotation
function positionFormatToolbar(textElement) {
  const rect = textElement.getBoundingClientRect();
  if (window.matchMedia("(max-width: 768px)").matches) {
    console.log("Screen width is 768px or less");
    textFormatToolbar.style.left = `10px`;
  textFormatToolbar.style.top =`92px`;
} else {
    console.log("Screen width is greater than 768px");

  textFormatToolbar.style.left = `${rect.left}px`;
  textFormatToolbar.style.top = `${
    rect.top - textFormatToolbar.offsetHeight - 10
  }px`;
}
}

// Function to update toolbar state based on current text styles
function updateToolbarState(textElement) {
  const computedStyle = window.getComputedStyle(textElement);

  // Update font family
  fontFamilySelect.value = computedStyle.fontFamily
    .split(",")[0]
    .replace(/['"]/g, "");

  // Update font size
  const fontSize = parseInt(computedStyle.fontSize);
  fontSizeSelect.value = fontSize.toString();

  // Update style buttons
  boldButton.classList.toggle("active", computedStyle.fontWeight >= 600);
  italicButton.classList.toggle("active", computedStyle.fontStyle === "italic");
  underlineButton.classList.toggle(
    "active",
    computedStyle.textDecoration.includes("underline")
  );

  // Update color picker
  colorPicker.value = rgbToHex(computedStyle.color);
  // textFormatToolbar.style.display = 'none';
}

// Helper function to convert RGB to Hex
function rgbToHex(rgb) {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return "#000000";

  function hex(x) {
    return ("0" + parseInt(x).toString(16)).slice(-2);
  }

  return "#" + hex(match[1]) + hex(match[2]) + hex(match[3]);
}

// Event listeners for text formatting
fontFamilySelect.addEventListener("change", () => {
  if (activeTextAnnotation) {
    activeTextAnnotation.style.fontFamily = fontFamilySelect.value;
    saveState();
  }
  textFormatToolbar.style.display = 'none';
});

fontSizeSelect.addEventListener("change", () => {
  if (activeTextAnnotation) {
    activeTextAnnotation.style.fontSize = `${fontSizeSelect.value}px`;
    saveState();
  }
  textFormatToolbar.style.display = 'none';
});

boldButton.addEventListener("click", () => {
  if (activeTextAnnotation) {
    const isBold = activeTextAnnotation.style.fontWeight === "bold";
    activeTextAnnotation.style.fontWeight = isBold ? "normal" : "bold";
    boldButton.classList.toggle("active");
    saveState();
    textFormatToolbar.style.display = 'none';
  }
});

italicButton.addEventListener("click", () => {
  if (activeTextAnnotation) {
    const isItalic = activeTextAnnotation.style.fontStyle === "italic";
    activeTextAnnotation.style.fontStyle = isItalic ? "normal" : "italic";
    italicButton.classList.toggle("active");
    saveState();

  }
});

underlineButton.addEventListener("click", () => {
  if (activeTextAnnotation) {
    const isUnderlined =
      activeTextAnnotation.style.textDecoration === "underline";
    activeTextAnnotation.style.textDecoration = isUnderlined
      ? "none"
      : "underline";
    underlineButton.classList.toggle("active");
    saveState();
    textFormatToolbar.style.display = 'none';
  }
});

colorPicker.addEventListener("input", () => {
  if (activeTextAnnotation) {
    activeTextAnnotation.style.color = colorPicker.value;
    saveState();
    // textFormatToolbar.style.display = 'none';
  }
});

colorPicker.addEventListener("change", () => {
  if (activeTextAnnotation) {
    activeTextAnnotation.style.color = colorPicker.value;
    saveState();
    textFormatToolbar.style.display = 'none';
  }
});

// Function to clear all annotations
function clearAllAnnotations() {
    const annotationLayers = document.querySelectorAll('.annotation-layer');
    
    annotationLayers.forEach(layer => {
        const annotations = layer.querySelectorAll('.round-annotation, .cross-annotation, .rectangle-annotation');
        
        annotations.forEach(annotation => {
            // Add fade-out animation
            annotation.style.transition = 'opacity 0.3s ease';
            annotation.style.opacity = '0';
        });
        
        // Remove after animation
        setTimeout(() => {
            annotations.forEach(annotation => {
                if (annotation.parentElement) {
                    annotation.parentElement.removeChild(annotation);
                }
            });
            saveState();
        }, 300);
    });
}

// Add event listener for clear all button
// document.getElementById('clearAll').addEventListener('click', () => {
//     if (confirm('Are you sure you want to delete all annotations?')) {
//         clearAllAnnotations();
//     }
// });

// Function to show notification
function showNotification(message, duration = 5000) {
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Hide after duration
    setTimeout(() => {
        notification.style.display = 'none';
    }, duration);
}
fetchAndLoadPDF();
