async function webcam(deviceId) {
	const display = document.getElementById("display");

	// 現在のカメラ停止
	if (display.srcObject) {
		display.srcObject.getTracks().forEach(track => {
			track.stop();
		});
		display.srcObject = null;
		display.style.height = '';
	}

	if (!deviceId) return;

	const stream = await navigator.mediaDevices.getUserMedia({
		video: {deviceId},
		audio: false,
	});
	display.srcObject = stream;
	display.style.height = 'auto';
	display.play();
}

async function setCameraSelect(onSelect) {
	const select = document.getElementById("camera-select");

	const deviceList = await navigator.mediaDevices.enumerateDevices();
	const cameraList = deviceList.filter(device => device.kind === 'videoinput');
	cameraList.forEach(camera => {
		const option = document.createElement('option');
		option.innerText = camera.label || camera.deviceId;
		option.setAttribute('value', camera.deviceId);
		select.appendChild(option);
	});

	select.addEventListener('change', () => {
		onSelect(select.selectedOptions[0].value);
	});
}

window.addEventListener('DOMContentLoaded', () => {
	setCameraSelect(deviceId => {
		webcam(deviceId);
	});
})