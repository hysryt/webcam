async function webcam() {
	const display = document.getElementById("display");
	const stream = await navigator.mediaDevices.getUserMedia({
		video: true,
		audio: false,
	});
	display.srcObject = stream;
	display.play();
}

webcam();