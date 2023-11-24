import express from 'express';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import { getPreviousMessages, saveMessage } from './db.js';

const app = express();
const server = createServer(app);
const io = new Server(server);

const USER_MESSAGE = 1;
const SYSTEM_MESSAGE = 2;
const CHAT_INIT = 3;
const COMMAND_MESSAGE = 4;

io.on('connection', async (socket) => {
	let username;
	socket.on(USER_MESSAGE, async (message, ackcb) => {
		try {
			await saveMessage(message);
		} catch (e) {
			console.log(e);
		}
		socket.broadcast.emit(USER_MESSAGE, message);
		ackcb();
	});

	socket.on(CHAT_INIT, async (user, ackcb) => {
		console.log(user);
		username = user.id;
		const prevMessages = await getPreviousMessages(10);
		prevMessages.forEach((message) => {
			socket.emit(USER_MESSAGE, message);
		});
		io.emit(SYSTEM_MESSAGE, 'CONNECT', username);

		ackcb();
	});

	socket.on(COMMAND_MESSAGE, (command, args, ackcb) => {
		if (command === '/user' || command === '/username') {
			const previousUsername = username.toString();
			username = args[0];
			io.emit(COMMAND_MESSAGE, 'USERNAME_CHANGE', [previousUsername, username]);
		}
		ackcb();
	});

	logIncomingAndOutgoingEvents(socket, true);
});

function logIncomingAndOutgoingEvents(socket, enabled) {
	if (!enabled) return;
	socket.onAny((eventCode, ...args) => {
		console.log(`incoming event: ${getEventNameByEventCode(eventCode)}`); // 'hello'
		// console.log(args); // [ 1, '2', { 3: '4', 5: ArrayBuffer (1) [ 6 ] } ]
	});

	socket.onAnyOutgoing((eventCode, ...args) => {
		console.log(`outgoing event: ${getEventNameByEventCode(eventCode)}`); // 'hello'
		// console.log(args); // [ 1, '2', { 3: '4', 5: ArrayBuffer (1) [ 6 ] } ]
	});
}

function getEventNameByEventCode(code) {
	switch (code) {
		case 1:
			return 'USER_MESSAGE';

		case 2:
			return 'SYSTEM_MESSAGE';

		case 3:
			return 'CHAT_INIT';

		case 4:
			return 'COMMAND_MESSAGE';

		default:
			return 'UNKNOWN MESSAGE';
	}
}

server.listen(3000, () => {
	console.log('server running at http://localhost:3000');
});
