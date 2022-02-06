window.addEventListener('DOMContentLoaded', async () => {
	await showConfirmDialog();

	const display = new Display();

	// カメラ選択セレクタ
	const cameraList = await getCameraList();
	setCameraSelect(cameraList, camera => {
		display.connectCamera(camera);
	});

	// キャプチャボタン
	document.getElementById('capture-button').addEventListener('click', () => {
		display.downloadCapture();
	});
});

/**
 * カメラを一時的に有効にしてカメラ許可/拒否の確認ダイアログを表示する
 */
 async function showConfirmDialog() {
	const stream = await navigator.mediaDevices.getUserMedia({
		video: true,
		audio: false,
	});
	stream.getTracks().forEach(track => {
		track.stop();
	});
}

/**
 * カメラリスト取得
 * @return {Promise<Camera[]>}
 */
async function getCameraList() {
	const deviceList = await navigator.mediaDevices.enumerateDevices();
	const list = deviceList.filter(device => device.kind === 'videoinput').map(device => {
		return new Camera(device);
	}).reduce((list, device) => {
		return {...list, [device.deviceId]: device};
	}, {});
	return list;
}

/**
 * カメラ選択セレクタ設定
 * @param {Camera[]} cameraList 
 * @param {(camera: Camera) => void} onSelect 
 */
async function setCameraSelect(cameraList, onSelect) {
	const select = document.getElementById("camera-select");

	Object.values(cameraList).forEach(camera => {
		const option = document.createElement('option');
		option.innerText = camera.label || camera.deviceId;
		option.setAttribute('value', camera.deviceId);
		select.appendChild(option);
	})

	select.addEventListener('change', () => {
		onSelect(cameraList[select.selectedOptions[0].value]);
	});
}

class Camera {
	deviceId;
	label;
	#stream;

	/**
	 * @param {MediaDeviceInfo} param0 
	 */
	constructor({deviceId, label}) {
		this.deviceId = deviceId;
		this.label = label;
		this.#stream = null;
	}

	stop() {
		if (this.#stream) {
			this.#stream.getTracks().forEach(track => {
				track.stop();
			});
		}
	}

	/**
	 * @return {Promise<MediaStream>}
	 */
	async start() {
		this.#stream = await navigator.mediaDevices.getUserMedia({
			video: {deviceId: this.deviceId},
			audio: false,
		});
		return this.#stream;
	}
}

class Display {
	#video;
	#camera;

	constructor() {
		this.#video = document.getElementById("display");
	}

	async connectCamera(camera) {
		if (this.#camera) {
			this.disconnectCamera();
		}

		display.srcObject = await camera.start();
		display.style.height = 'auto';
		display.play();
		this.#camera = camera;
	}

	disconnectCamera() {
		if (this.#camera) {
			this.#camera.stop();
		}
		this.#video.srcObject = null;
		this.#video.height = '';
	}

	downloadCapture() {
		const dataURL = this._capture();
		this._downloadDataURL(dataURL);
	}

	/**
	 * @return {string}
	 */
	_capture() {
		const canvas = document.getElementById('canvas');
		canvas.width = this.#video.clientWidth;
		canvas.height =  this.#video.clientHeight;
		canvas.getContext('2d').drawImage(this.#video, 0, 0, this.#video.clientWidth, this.#video.clientHeight);
		return canvas.toDataURL('image/jpeg');
	}

	_downloadDataURL(dataURL) {
		const download = document.createElement('a');
		download.href = dataURL;
		download.download = 'capture.jpg';
		download.click();
	}
}