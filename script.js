window.addEventListener('DOMContentLoaded', async () => {
	await showConfirmDialog();

	const display = new Display();

	// カメラ選択セレクタ
	const cameraList = await getCameraList();
	setCameraSelect(cameraList, camera => {
		display.connectCamera(camera);
	});

	// 静止画でキャプチャボタン
	document.getElementById('capture-button').addEventListener('click', () => {
		display.downloadCapture();
	});

	// 動画でキャプチャボタン
	document.getElementById('capture-movie-start-button').addEventListener('click', () => {
		display.startRecord();

		document.getElementById('capture-movie-start-button').style.display = 'none';
		document.getElementById('capture-movie-stop-button').style.display = 'block';
	});

	// キャプチャ停止ボタン
	document.getElementById('capture-movie-stop-button').addEventListener('click', () => {
		display.stopRecord();

		document.getElementById('capture-movie-start-button').style.display = 'block';
		document.getElementById('capture-movie-stop-button').style.display = 'none';
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
			this.#stream = null;
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

	/**
	 * ストリームを取得
	 * @returns {MediaStream}
	 */
	getStream() {
		if (!this.#stream) {
			throw new Error('カメラが起動していません');
		}
		return this.#stream;
	}
}

class Display {
	#video;
	#camera;
	#recorder;

	constructor() {
		this.#video = document.getElementById("display");
		this.#recorder = null;
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

	async downloadCapture() {
		const blob = await this._capture();
		this._downloadBlob(blob);
	}

	/**
	 * @return {Blob}
	 */
	async _capture() {
		const canvas = document.getElementById('canvas');
		canvas.width = this.#video.clientWidth;
		canvas.height =  this.#video.clientHeight;
		canvas.getContext('2d').drawImage(this.#video, 0, 0, this.#video.clientWidth, this.#video.clientHeight);
		return await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
	}

	/**
	 * @param {Blob} blob
	 */
	_downloadBlob(blob) {
		const download = document.createElement('a');
		const objectUrl = URL.createObjectURL(blob);
		download.href = objectUrl;
		download.download = 'capture.jpg';
		download.click();

		// 10秒後にオブジェクトURL破棄
		setTimeout(() => {
			URL.revokeObjectURL(objectUrl);
		}, 10000);
	}

	/**
	 * 録画開始
	 */
	startRecord() {
		if (!this.#camera) {
			throw new Error('カメラが選択されていません');
		}

		this.#recorder = new Recorder(this.#camera.getStream());
		this.#recorder.start();
	}

	/**
	 * 録画終了
	 */
	stopRecord() {
		if (!this.#recorder) {
			throw new Error('録画が開始されていません');
		}

		this.#recorder.stop();
		this.#recorder.download();
		this.#recorder = null;
	}
}


class Recorder {
	#isRecording = false;
	#recorder = null;
	#extension = null;
	#chunks = [];

	constructor(stream) {
		const videoType = this._detectVideoType();
		if (videoType === null) {
			throw new Error('使用可能なMIMETypeがありません')
		}

		const mimeType = videoType.mimeType;
		this.#extension = videoType.extension;

		this.#recorder = new MediaRecorder(stream, {
			mimeType,
		});

		this.#recorder.ondataavailable = (e) => {
			this.#chunks.push(e.data);
		}
	}

	/**
	 * @typedef {Object} VideoType
	 * @property {string} mimeType
	 * @property {string} extension
	 * @returns {?VideoType}
	 */
	_detectVideoType() {
		const list = {
			'video/mp4': '.mp4', // for iOS
			'video/webm': '.webm',
		};
		for (const mimeType in list) {
			if (MediaRecorder.isTypeSupported(mimeType)) {
				return {
					mimeType,
					extension: list[mimeType],
				}
			}
		}
		return null;
	}

	start() {
		if (this.#isRecording) {
			throw new Error('既に録画中です');
		}

		this.#isRecording = true;
		this.#recorder.start(1000);
	}

	stop() {
		if (!this.#isRecording) {
			throw new Error('録画開始されていません');
		}

		this.#recorder.stop();
		this.#isRecording = false;
	}

	download() {
		if (this.#chunks.length === 0) {
			throw new Error('録画データがありません');
		}
		
		var blob = new Blob(this.#chunks, {type: this.#recorder.mimeType});
		this._downloadBlob(blob);
	}

	_downloadBlob(blob) {
		const objectUrl = URL.createObjectURL(blob);
		const download = document.createElement('a');
		download.href = objectUrl;
		download.download = 'capture' + this.#extension;
		download.click();

		// 10秒後にオブジェクトURL破棄
		setTimeout(() => {
			URL.revokeObjectURL(objectUrl);
		}, 10000);
	}
}