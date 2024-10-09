import * as THREE from 'three';
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let video, handLandmarker, scene, camera, renderer, decoration;

async function setupCamera() {
    video = document.getElementById('video');
    const stream = await navigator.mediaDevices.getUserMedia({video: true});
    video.srcObject = stream;
    return new Promise(resolve => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadHandLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
    });
}

function setupThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('output')});
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshBasicMaterial({color: 0xff0000});
    decoration = new THREE.Mesh(geometry, material);
    scene.add(decoration);

    camera.position.z = 5;
}

function onResults(results) {
    if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const wrist = landmarks[0];
        const x = (wrist.x - 0.5) * 5;
        const y = -(wrist.y - 0.5) * 5;
        const z = -wrist.z * 5;

        decoration.position.set(x, y, z);
    }
    renderer.render(scene, camera);
}

async function app() {
    await setupCamera();
    await loadHandLandmarker();
    setupThreeJS();

    video.play();

    async function detectionLoop() {
        if (!handLandmarker || !video.videoWidth) {
            requestAnimationFrame(detectionLoop);
            return;
        }

        let startTimeMs = performance.now();
        const results = handLandmarker.detectForVideo(video, startTimeMs);
        onResults(results);
        requestAnimationFrame(detectionLoop);
    }

    detectionLoop();
}

app();