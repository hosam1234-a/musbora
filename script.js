// تهيئة السبورة
const canvas = new fabric.Canvas('canvas', {
  backgroundColor: '#ffffff'
});

// المتغيرات
let isRecording = false;
let recordedChunks = [];
let recordedVideoBlob = null;
let copiedObject = null;
let cameraStream = null;

// عناصر واجهة المستخدم
const penBtn = document.getElementById('pen');
const eraserBtn = document.getElementById('eraser');
const selectBtn = document.getElementById('select');
const colorPicker = document.getElementById('colorPicker');
const thickness = document.getElementById('thickness');
const thicknessValue = document.getElementById('thicknessValue');
const addTextBtn = document.getElementById('addText');
const bgColorInput = document.getElementById('bgColor');
const clearBtn = document.getElementById('clear');
const recordBtn = document.getElementById('record');
const previewVideoBtn = document.getElementById('previewVideo');
const exportImgBtn = document.getElementById('exportImg');
const uploadImageButton = document.getElementById('uploadImageButton');
const linePatternSelect = document.getElementById('linePattern');
const saveProjectBtn = document.getElementById('saveProject');
const loadProjectBtn = document.getElementById('loadProject');
const trimStartBtn = document.getElementById('trimStart');
const trimEndBtn = document.getElementById('trimEnd');
const openCameraBtn = document.getElementById('openCamera');
const closeCameraBtn = document.getElementById('closeCamera');
const videoContainer = document.getElementById('videoContainer');
const cameraPreview = document.getElementById('cameraPreview');
const fileInput = document.getElementById('fileInput');

// زر دمج الكاميرا
const compositeModeBtn = document.createElement('button');
compositeModeBtn.textContent = '🖼️ دمج الكاميرا في التسجيل';
document.querySelector('.toolbar').appendChild(compositeModeBtn);

let isCompositeMode = false;

// --- تعطيل الرسم ---
function deactivateDrawing() {
  canvas.isDrawingMode = false;
  canvas.selection = true;
}

// --- تفعيل القلم ---
penBtn.addEventListener('click', () => {
  deactivateDrawing();
  canvas.isDrawingMode = true;
  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  canvas.freeDrawingBrush.color = colorPicker.value;
  canvas.freeDrawingBrush.width = parseInt(thickness.value, 10);
});

// --- تفعيل الممحاة ---
eraserBtn.addEventListener('click', () => {
  deactivateDrawing();
  canvas.isDrawingMode = true;
  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  canvas.freeDrawingBrush.color = '#ffffff';
  canvas.freeDrawingBrush.width = parseInt(thickness.value, 10) + 15;
});

// --- وضع التحديد ---
selectBtn.addEventListener('click', () => {
  deactivateDrawing();
});

// --- سماكة القلم ---
thickness.addEventListener('input', () => {
  thicknessValue.textContent = thickness.value;
  if (canvas.isDrawingMode) {
    canvas.freeDrawingBrush.width = parseInt(thickness.value, 10);
  }
});

// --- لون القلم ---
colorPicker.addEventListener('input', () => {
  if (canvas.isDrawingMode) {
    canvas.freeDrawingBrush.color = colorPicker.value;
  }
});

// --- إضافة نص ---
addTextBtn.addEventListener('click', () => {
  deactivateDrawing();
  const text = new fabric.IText('نص هنا...', {
    left: 100,
    top: 100,
    fill: colorPicker.value,
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    hasRotatingPoint: true
  });
  canvas.add(text);
  canvas.setActiveObject(text);
});

// --- تحميل صورة ---
uploadImageButton.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (url) => {
      fabric.Image.fromURL(url.target.result, (img) => {
        img.scaleToWidth(250);
        img.set({
          left: 100,
          top: 100,
          hasControls: true,
          cornerStyle: 'circle',
          transparentCorners: false
        });
        canvas.add(img);
        canvas.setActiveObject(img);
      });
    };
    reader.readAsDataURL(file);
  };
  input.click();
});

// --- خلفية خطوط ---
function setBackgroundImage(type) {
  const patternCanvas = document.createElement('canvas');
  const ctx = patternCanvas.getContext('2d');
  patternCanvas.width = 50;
  patternCanvas.height = 50;
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;

  switch (type) {
    case 'lined':
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(50, 40);
      ctx.stroke();
      break;
    case 'grid':
      ctx.beginPath();
      ctx.moveTo(0, 25);
      ctx.lineTo(50, 25);
      ctx.moveTo(25, 0);
      ctx.lineTo(25, 50);
      ctx.stroke();
      break;
    case 'dots':
      ctx.beginPath();
      ctx.arc(25, 25, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      return;
  }

  const pattern = new fabric.Pattern({ source: patternCanvas, repeat: 'repeat' });
  canvas.backgroundColor = pattern;
  canvas.renderAll();
}

linePatternSelect.addEventListener('change', () => {
  const type = linePatternSelect.value;
  if (type === 'blank') {
    canvas.backgroundColor = bgColorInput.value;
  } else {
    setBackgroundImage(type);
  }
  canvas.renderAll();
});

// --- مسح الكل ---
clearBtn.addEventListener('click', () => {
  canvas.clear();
  if (linePatternSelect.value === 'blank') {
    canvas.backgroundColor = bgColorInput.value;
  } else {
    setBackgroundImage(linePatternSelect.value);
  }
  canvas.renderAll();
});

// --- نسخ ولصق ---
document.addEventListener('keydown', (e) => {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;

  if (e.ctrlKey && e.key === 'c') {
    copiedObject = fabric.util.object.clone(activeObject);
    alert('تم النسخ!');
  }

  if (e.ctrlKey && e.key === 'v') {
    if (copiedObject) {
      const pasted = fabric.util.object.clone(copiedObject);
      pasted.set({ left: pasted.left + 10, top: pasted.top + 10 });
      pasted.setCoords();
      canvas.add(pasted);
      canvas.setActiveObject(pasted);
    }
  }
});

// --- فتح الكاميرا ---
openCameraBtn.addEventListener('click', async () => {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraPreview.srcObject = cameraStream;
    videoContainer.style.display = 'block';
    openCameraBtn.style.display = 'none';
    closeCameraBtn.style.display = 'inline-block';
  } catch (err) {
    alert("فشل في الوصول إلى الكاميرا: " + err.message);
  }
});

// --- إغلاق الكاميرا ---
closeCameraBtn.addEventListener('click', () => {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraPreview.srcObject = null;
  }
  videoContainer.style.display = 'none';
  openCameraBtn.style.display = 'inline-block';
  closeCameraBtn.style.display = 'none';

  if (isCompositeMode) {
    const obj = canvas.getObjects().find(o => o.src === cameraPreview);
    if (obj) canvas.remove(obj);
    isCompositeMode = false;
    compositeModeBtn.textContent = '🖼️ دمج الكاميرا في التسجيل';
  }
});

// --- دمج الكاميرا في السبورة ---
compositeModeBtn.addEventListener('click', () => {
  if (!cameraStream) {
    alert("يرجى فتح الكاميرا أولًا!");
    return;
  }

  isCompositeMode = !isCompositeMode;
  if (isCompositeMode) {
    videoContainer.style.border = '3px solid yellow';
    compositeModeBtn.textContent = '✅ دمج مفعّل';

    const fabricVideo = new fabric.Image(cameraPreview, {
      left: 50,
      top: 50,
      width: 240,
      height: 180,
      objectCaching: false,
      hasControls: true,
      cornerStyle: 'circle'
    });
    canvas.add(fabricVideo);
    canvas.renderAll();
  } else {
    videoContainer.style.border = '2px solid #007bff';
    compositeModeBtn.textContent = '🖼️ دمج الكاميرا في التسجيل';
    const obj = canvas.getObjects().find(o => o.src === cameraPreview);
    if (obj) canvas.remove(obj);
  }
});

// --- تسجيل الفيديو مع صوت ---
let stream = null;
let audioStream = null;
let mediaRecorder = null;

recordBtn.addEventListener('click', async () => {
  if (isRecording) {
    mediaRecorder.stop();
    if (audioStream) audioStream.getTracks().forEach(t => t.stop());
    stream.getTracks().forEach(t => t.stop());
    recordBtn.textContent = 'بدء التسجيل';
    isRecording = false;
  } else {
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream = canvas.lowerCanvasEl.captureStream(30);
      stream.addTrack(audioStream.getAudioTracks()[0]);

      recordedChunks = [];
      const mimeType = 'video/webm;codecs=vp8';
      mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = e => e.data.size > 0 && recordedChunks.push(e.data);
      mediaRecorder.onstop = () => {
        alert("تم التسجيل. اضغط 'معاينة التسجيل' لعرضه أو تحميله.");
      };

      mediaRecorder.start();
      recordBtn.textContent = 'إيقاف التسجيل';
      isRecording = true;
    } catch (err) {
      alert("خطأ في الوصول إلى المايكروفون: " + err.message);
    }
  }
});

// --- معاينة التسجيل ---
previewVideoBtn.addEventListener('click', () => {
  if (isRecording) return alert("أوقف التسجيل أولًا.");
  if (recordedChunks.length === 0) return alert("لم يتم التسجيل بعد.");

  recordedVideoBlob = new Blob(recordedChunks, { type: 'video/webm;codecs=vp8' });
  const url = URL.createObjectURL(recordedVideoBlob);
  const win = window.open('', '_blank', 'width=800,height=600');
  win.document.title = 'معاينة التسجيل';
  win.document.body.innerHTML = `
    <h2 style="text-align:center;">معاينة التسجيل</h2>
    <div style="padding:20px;">
      <video controls width="700" style="display:block;margin:0 auto;">
        <source src="${url}" type="video/webm">
        متصفحك لا يدعم الفيديو.
      </video>
      <div style="text-align:center;margin-top:20px;">
        <button id="downloadBtn" style="padding:10px 20px;font-size:16px;">⬇️ تحميل الفيديو (MP4)</button>
      </div>
    </div>
  `;

  win.document.getElementById('downloadBtn').onclick = async () => {
    try {
      const arrayBuffer = await recordedVideoBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await window.electronAPI.saveVideo(buffer);
      if (result.success) {
        alert(`تم الحفظ بنجاح!\n${result.path}`);
      } else {
        alert('فشل الحفظ: ' + result.message);
      }
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  };
});

// --- تصدير كصورة ---
exportImgBtn.addEventListener('click', () => {
  const dataURL = canvas.toDataURL({ format: 'png' });
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'سبورة.png';
  a.click();
});

// --- حفظ المشروع ---
saveProjectBtn.addEventListener('click', () => {
  const data = {
    canvas: canvas.toJSON(['id']),
    backgroundColor: canvas.backgroundColor,
    backgroundPattern: linePatternSelect.value
  };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'مشروع_السبورة.sboard';
  a.click();
});

// --- فتح مشروع ---
loadProjectBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      canvas.clear();
      if (data.backgroundPattern && data.backgroundPattern !== 'blank') {
        setBackgroundImage(data.backgroundPattern);
        linePatternSelect.value = data.backgroundPattern;
      } else {
        canvas.backgroundColor = data.backgroundColor;
        linePatternSelect.value = 'blank';
        bgColorInput.value = data.backgroundColor || '#ffffff';
      }
      canvas.loadFromJSON(data.canvas, () => canvas.renderAll());
    } catch (err) {
      alert("خطأ في فتح الملف.");
    }
  };
  reader.readAsText(file);
});

// --- قص التسجيل ---
trimStartBtn.addEventListener('click', () => {
  if (recordedChunks.length > 5) {
    recordedChunks = recordedChunks.slice(Math.floor(recordedChunks.length * 0.1));
    alert("تم قص 10% من البداية.");
  }
});
trimEndBtn.addEventListener('click', () => {
  if (recordedChunks.length > 5) {
    recordedChunks = recordedChunks.slice(0, -Math.floor(recordedChunks.length * 0.1));
    alert("تم قص 10% من النهاية.");
  }
});

// --- تهيئة أولية ---
deactivateDrawing();
