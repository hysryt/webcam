import Camera from "./js/camera.js";
import Display from "./js/display.js";

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

		document.getElementById('record-mark').style.display = 'block';
		document.getElementById('capture-movie-start-button').style.display = 'none';
		document.getElementById('capture-movie-stop-button').style.display = 'block';
	});

	// キャプチャ停止ボタン
	document.getElementById('capture-movie-stop-button').addEventListener('click', () => {
		display.stopRecord();

		document.getElementById('record-mark').style.display = '';
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