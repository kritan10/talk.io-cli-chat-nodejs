import express from 'express';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import { getPreviousMessages, saveMessage } from './db.js';
import { AuthMessageTypes, ChatEvents, CommandMessageTypes, SystemMessageTypes } from '../events/ChatEvents.js';

const app = express();
const server = createServer(app);
const io = new Server(server);

let users = [];

io.on('connection', async (socket) => {
	let username;

	socket.on(ChatEvents.USER_MESSAGE, async (message, ackcb) => {
		try {
			await saveMessage(message);
		} catch (e) {
			console.log(e);
		}
		socket.broadcast.emit(ChatEvents.USER_MESSAGE, message);
		ackcb();
	});

	socket.on(ChatEvents.CHAT_INIT, async ({ username }, ackcb) => {
		console.log(username);
		const prevMessages = await getPreviousMessages(5);
		prevMessages.forEach((message) => {
			socket.emit(ChatEvents.USER_MESSAGE, message);
		});
		io.emit(ChatEvents.SYSTEM_MESSAGE, SystemMessageTypes.USER_CONNECT, [username]);

		ackcb();
	});

	socket.on(ChatEvents.COMMAND_MESSAGE, (message, ackcb) => {
		const command = parseCommandMessage(message);
		socket.emit(ChatEvents.COMMAND_MESSAGE, command);
		ackcb();
	});

	socket.on(ChatEvents.AUTH_MESSAGE, (message, username, ackcb) => {
		if (message === AuthMessageTypes.LOGIN) {
			const isUserExist = users.find((user) => user.username === username);
			if (isUserExist) {
				socket.emit(ChatEvents.AUTH_MESSAGE, false);
				ackcb();
				return;
			}
			users.push({ username: username, id: socket.id });
			console.log(`USERS: ${users[0]}`);
			socket.emit(ChatEvents.AUTH_MESSAGE, true, username);
		}

		ackcb();
	});

	socket.on('disconnect', () => {
		const user = users.find((user) => user.id === socket.id);
		users = users.filter((user) => user.id !== socket.id);
		console.log(`USERS: ${users}`);
		io.emit(ChatEvents.SYSTEM_MESSAGE, SystemMessageTypes.USER_DISCONNECT, [user.username]);
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

		case 5:
			return 'AUTH_MESSAGE';

		default:
			return 'UNKNOWN MESSAGE';
	}
}

function parseCommandMessage(inputCommand) {
	const inputCommandArray = inputCommand.split(' ');

	// command should have at least one character
	if (inputCommandArray.length < 1) return { command: CommandMessageTypes.INVALID_COMMAND };

	// get the command keyword and remove it from the list
	const command = inputCommandArray.shift();
	// get the command args
	const args = inputCommandArray;

	if ((command === '/user' || command === '/username') && args.length >= 2) {
		const [_, newName] = args;
		io.emit(ChatEvents.SYSTEM_MESSAGE, SystemMessageTypes.USER_NAME_CHANGE, args);
		return {
			type: CommandMessageTypes.USERNAME_CHANGE,
			newName: newName,
		};
	}

	if (command === '/clear') {
		return {
			type: CommandMessageTypes.CLEAR_CHAT,
		};
	}

	return { type: CommandMessageTypes.INVALID_COMMAND };
}

server.listen(3000, () => {
	console.log('server running at http://localhost:3000');
});
