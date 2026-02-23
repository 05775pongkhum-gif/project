const URL = "./model/";

let model, webcam, labelContainer, maxPredictions;
let isRunning = false;

// ===== ตั้งค่า =====
const TARGET_CLASS = "close eye"; // ชื่อต้องตรงกับ TM
const THRESHOLD = 0.95;        // มากกว่า 95%
const INTERVAL_MS = 5000;      // ทุก 5 วินาที

let closedStartTime = null;
let lastAlarmTime = 0;

// เสียงเตือน
const alarm = new Audio("fah.mp3");

async function init() {
    if (isRunning) return;
    isRunning = true;

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    webcam = new tmImage.Webcam(200, 200, true);
    await webcam.setup();
    await webcam.play();

    document.getElementById("webcam-container").innerHTML = "";
    document.getElementById("webcam-container").appendChild(webcam.canvas);

    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "";
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }

    window.requestAnimationFrame(loop);
}

async function loop() {
    if (!isRunning) return;
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);
    let isClosedEye = false;

    for (let i = 0; i < maxPredictions; i++) {
        const { className, probability } = prediction[i];
        labelContainer.childNodes[i].innerHTML =
            `${className} : ${probability.toFixed(2)}`;

        if (className === TARGET_CLASS && probability >= THRESHOLD) {
            isClosedEye = true;
        }
    }

    const now = Date.now();

    if (isClosedEye) {
        if (closedStartTime === null) {
            closedStartTime = now;
            lastAlarmTime = 0;
        }

        if (
            now - closedStartTime >= INTERVAL_MS &&
            (lastAlarmTime === 0 || now - lastAlarmTime >= INTERVAL_MS)
        ) {
            alarm.currentTime = 0;
            alarm.play();
            lastAlarmTime = now;
        }
    } else {
        resetTimer();
    }
}

function stop() {
    if (!isRunning) return;
    isRunning = false;

    if (webcam) webcam.stop();

    alarm.pause();
    alarm.currentTime = 0;
    resetTimer();
}

function resetTimer() {
    closedStartTime = null;
    lastAlarmTime = 0;
}
