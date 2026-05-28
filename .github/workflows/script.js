let mediaRecorder = null;
let recordedChunks = [];

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusEl = document.getElementById('status');
const downloadSection = document.getElementById('download-section');
const resolutionSelector = document.getElementById('resolution');
const fpsSelector = document.getElementById('fps');

// Start recording
startBtn.addEventListener('click', startRecording);

// Stop recording
stopBtn.addEventListener('click', stopRecording);

// Download recording
downloadBtn.addEventListener('click', downloadRecording);

async function startRecording() {
    try {
        const resolution = parseInt(resolutionSelector.value);
        const fps = parseInt(fpsSelector.value);
        
        // Get resolution dimensions
        let width, height;
        switch(resolution) {
            case 720:
                width = 1280;
                height = 720;
                break;
            case 1080:
                width = 1920;
                height = 1080;
                break;
            case 1440:
                width = 2560;
                height = 1440;
                break;
            case 2160:
                width = 3840;
                height = 2160;
                break;
            case 4320:
                width = 7680;
                height = 4320;
                break;
            default:
                width = 1920;
                height = 1080;
        }
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: 'always',
                width: { ideal: width },
                height: { ideal: height },
                frameRate: { ideal: fps }
            },
            audio: true
        });

        recordedChunks = [];
        const options = { mimeType: 'video/webm;codecs=vp9' };

        // Fallback if vp9 is not supported
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm;codecs=vp8';
        }

        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm';
        }

        mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstart = () => {
            startBtn.disabled = true;
            stopBtn.disabled = false;
            resolutionSelector.disabled = true;
            fpsSelector.disabled = true;
            downloadSection.style.display = 'none';
            statusEl.textContent = `Recording at ${resolution}p ${fps}fps...`;
        };

        mediaRecorder.onstop = () => {
            stopBtn.disabled = true;
            startBtn.disabled = false;
            resolutionSelector.disabled = false;
            fpsSelector.disabled = false;
            downloadSection.style.display = 'block';
            statusEl.textContent = 'Recording finished!';
        };

        mediaRecorder.start();

        // Handle stream ending (e.g., user stops sharing)
        stream.getTracks().forEach(track => {
            track.onended = () => {
                if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                    stopBtn.disabled = true;
                    startBtn.disabled = false;
                    resolutionSelector.disabled = false;
                    fpsSelector.disabled = false;
                }
            };
        });
    } catch (error) {
        if (error.name === 'NotAllowedError') {
            statusEl.textContent = 'Recording was cancelled';
        } else {
            statusEl.textContent = `Error: ${error.message}`;
            console.error(error);
        }
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

function downloadRecording() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screen-recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Check for browser support
window.addEventListener('load', () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        statusEl.textContent = 'Your browser does not support screen recording';
        startBtn.disabled = true;
    }
});
