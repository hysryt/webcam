export default class Camera {
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