import { input, output, refreshScreen, screen } from './cli.js';
import { socket } from './socket.js';
import { AuthMessageTypes, ChatEvents, CommandMessageTypes, SystemMessageTypes } from '../events/ChatEvents.js';
import chalk from 'chalk';
// import { hostname } from 'node:os';

let counter = 1;
let username = null;

socket.on(ChatEvents.AUTH_MESSAGE, authHandler);

function authHandler(status, mUsername) {
	if (status === true) {
		username = mUsername;
		addAllListeners();
		output.clearItems();
		output.addItem(chalk.bold.bgBlue('Welcome to epic-chat'));
		refreshScreen();
		socket.emit(ChatEvents.CHAT_INIT, { username: username, timestamp: new Date().toDateString() });
	}
	if (status === false) {
		socket.removeAllListeners();
		output.add('Invalid login. This user is already logged in');
		refreshScreen();
		socket.on(ChatEvents.AUTH_MESSAGE, authHandler);
	}
}

function addAllListeners() {
	// on-user-message-received
	socket.on(ChatEvents.USER_MESSAGE, (message) => {
		output.addItem(convertMessageToString(message));
		screen.render();
	});

	// on-system-message-received
	socket.on(ChatEvents.SYSTEM_MESSAGE, (message, args) => {
		const textContent = createSystemMessage(message, args);
		output.addItem(textContent);
		screen.render();
	});

	//on-command-message-received
	socket.on(ChatEvents.COMMAND_MESSAGE, (command) => {
		switch (command.type) {
			case CommandMessageTypes.USERNAME_CHANGE:
				username = command.newName;
				break;

			case CommandMessageTypes.CLEAR_CHAT:
				output.clearItems();
				break;

			case CommandMessageTypes.INVALID_COMMAND:
				output.addItem('Invalid command');
				break;

			default:
				output.addItem('Invalid command');
				break;
		}
		refreshScreen();
	});
}
// socket.on(CHAT_INIT, (user) => {});

// on-user-press-enter
// main method where all user input is handled
input.key('enter', inputHandler);

async function inputHandler() {
	const userInput = input.getValue();

	// do nothing if enter pressed on empty input
	if (!userInput) return;

	if (socket.disconnected) {
		input.clearValue();
		output.addItem('No server connection.');
		// for (let i = 1; i < 5; i++) {
		// 	output.addItem(`Trying to establish connection with the server (${i}).`);
		// 	socket.connect();
		// 	if (socket.connected) {
		// 		return inputHandler();
		// 	}
		// 	await sleep(5000);
		// }
		output.addItem('Server unreachable.');
		refreshScreen();
		return;
	}

	// check if the user input is a command
	if (userInput.startsWith('/')) {
		// check for login command
		if (userInput.startsWith('/login')) {
			if (username !== null) {
				output.addItem('You are already logged in as ${username}');
				refreshScreen();
				return;
			}
			const mUsername = userInput.split(' ')[1];
			socket.emit(ChatEvents.AUTH_MESSAGE, AuthMessageTypes.LOGIN, mUsername);
			return;
		}

		// check for logout
		if (userInput.startsWith('/logout')) {
			if (username === null) {
				output.addItem('Not logged in');
				refreshScreen();
				return;
			}
			socket.emit(ChatEvents.AUTH_MESSAGE, AuthMessageTypes.LOGOUT);
			return;
		}

		const command = userInput;
		socket.emit(ChatEvents.COMMAND_MESSAGE, command);
		return;
	}

	if (username === null) {
		output.addItem('You need to be logged in to send messages.');
		refreshScreen();
		return;
	}

	// socket.emit(ChatEvents.CHAT_INIT, { username: username, timestamp: new Date().toDateString() })
	const message = createUserMessage(userInput);
	output.addItem(convertMessageToString(message));
	socket.emit(ChatEvents.USER_MESSAGE, message);

	refreshScreen();
}

/**
 * Method to create a message object from raw string input.
 * @param {string} userInput the raw user input provided from the cli
 * @returns a message object with content, sender and sendtime
 */
function createUserMessage(userInput) {
	const message = {
		content: userInput,
		sender: username,
		sendTime: new Date().toString().split(' ')[4],
	};
	return message;
}

/**
 * Method to format message object to string
 * @param {object} message the message object
 * @returns a string version of this object in [HH:MM:SS] sender_name: message.content form
 */
function convertMessageToString(message) {
	const { sendTime, sender, content } = message;
	const textContent = `{gray-fg}[${sendTime}]{/gray-fg} ${sender === username ? chalk.bgGreen(sender) : chalk.bgBlue(sender)}: ${content}`;
	return textContent;
}

function createSystemMessage(msg, args) {
	if (msg === SystemMessageTypes.USER_CONNECT) {
		const user = args[0];
		return `${user} joined the chat.`;
	}

	if (msg === SystemMessageTypes.USER_DISCONNECT) {
		const user = args[0];
		return `${user} left the chat.`;
	}

	if (msg === SystemMessageTypes.USER_NAME_CHANGE) {
		const previousName = args[0];
		const newName = args[1];
		return `${previousName} changed their name to ${newName}`;
	}

	return 'null';
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
