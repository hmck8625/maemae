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
    const hands = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    hands.onResults(onResults);

    handLandmarker = hands;
}

function setupThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({canvas: document.getElementById('output')});
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 手の装飾用の3Dオブジェクトを作成
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshBasicMaterial({color: 0xff0000});
    decoration = new THREE.Mesh(geometry, material);
    scene.add(decoration);

    camera.position.z = 5;
}

function onResults(results) {
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            // 手の中心（手首）の位置を取得
            const wrist = landmarks[0];
            // Three.jsの座標系に変換
            const x = (wrist.x - 0.5) * 5;
            const y = -(wrist.y - 0.5) * 5;
            const z = -wrist.z * 5;

            // 装飾の位置を更新
            decoration.position.set(x, y, z);
        }
    }
    renderer.render(scene, camera);
}

async function app() {
    await setupCamera();
    await loadHandLandmarker();
    setupThreeJS();

    video.play();
    video.addEventListener('loadeddata', async () => {
        await handLandmarker.send({image: video});
    });

    async function detectionLoop() {
        await handLandmarker.send({image: video});
        requestAnimationFrame(detectionLoop);
    }
    detectionLoop();
}

app();