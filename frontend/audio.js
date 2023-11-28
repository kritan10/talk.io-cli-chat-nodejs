import path from 'node:path';
import Afplay from 'afplay';

let player = null;
try {
	player = new Afplay();
} catch (error) {}

/**
 * This method plays an audio using the afplay library.
 * Call this method when a message is received.
 */
async function playMessageReceivedAudio() {
	if (player) {
		const audio = path.resolve('frontend', 'chat_received.mp3').toString();
		await player.play(audio);
	}
}

export { playMessageReceivedAudio };
