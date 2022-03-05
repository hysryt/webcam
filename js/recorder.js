export default class Recorder {
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