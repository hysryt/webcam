import Recorder from "./recorder.js";

export default class Display {
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