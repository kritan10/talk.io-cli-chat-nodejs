import process from 'node:process';
import blessed from 'blessed';
import { io } from 'socket.io-client';
import { hostname } from 'node:os';

const USER_MESSAGE = 1;
const SYSTEM_MESSAGE = 2;
const CHAT_INIT = 3;
const COMMAND_MESSAGE = 4;

let counter = 1;

// web socket
const socket = io('http://localhost:3000/', { ackTimeout: 10000, retries: 3 });
let username = hostname();

socket.emit(CHAT_INIT, { id: username, timestamp: new Date().toDateString() });

// blessed-screen
const screen = blessed.screen({
	smartCSR: true,
	title: 'Split Terminal',
});

// messages-output
const output = blessed.list({
	top: 0,
	left: 0,
	width: '100%',
	height: '80%',
	tags: true,
	border: {
		type: 'line',
	},
	style: {
		fg: 'white',
		border: {
			fg: '#f0f0f0',
		},
	},
});

// text-input
const input = blessed.textbox({
	bottom: 0,
	left: 0,
	width: '100%',
	height: '20%',
	inputOnFocus: true,
	border: {
		type: 'line',
	},
	style: {
		fg: 'white',
		border: {
			fg: '#f0f0f0',
		},
	},
});

function initScreen() {
	// Append the boxes to the screen
	screen.append(output);
	screen.append(input);
	// Focus on the input box by default
	input.focus();
	// Add welcome message
	output.addItem('Welcome to my chat-app!');
	// Event handler for Ctrl+C to exit the program
	screen.key(['C-c'], () => {
		return process.exit(0);
	});
	input.key(['C-c'], () => {
		return process.exit(0);
	});
	// Render the screen
	screen.render();
}

initScreen();

// on-user-message-received
socket.on(USER_MESSAGE, (message) => {
	output.addItem(convertMessageToString(message));
	screen.render();
});

// on-system-message-received
socket.on(SYSTEM_MESSAGE, (message, user) => {
	const textContent = createSystemMessage(message, user);
	output.addItem(textContent);
});

socket.on(COMMAND_MESSAGE, (command, args) => {
	if (command === 'USERNAME_CHANGE') {
		const [previousName, newName] = args;
		const textContent = `${previousName} changed name to ${newName}`;
		username = newName;
		output.addItem(textContent);
		screen.render();
	}
});

// socket.on(CHAT_INIT, (user) => {});

// on-message-send
input.key('enter', () => {
	const userInput = input.getValue();
	if (!userInput) {
		return;
	} else if (userInput.startsWith('/')) {
		const userInputArray = userInput.split(' ');
		if (userInputArray.length < 2) return;
		const command = userInputArray[0];
		const args = [...userInputArray];
		args.shift();
		socket.emit(COMMAND_MESSAGE, command, args);
	} else {
		const message = createUserMessage(userInput);
		output.addItem(convertMessageToString(message));
		socket.emit(USER_MESSAGE, message);
	}

	// UI related
	input.clearValue();
	input.focus();
	screen.render();
});

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
	const textContent = `[${message.sendTime}] ${message.sender}: ${message.content}`;
	return textContent;
}

function createSystemMessage(msg, user) {
	if (msg === 'CONNECT') {
		return `${user} joined the chat.`;
	}

	if (msg === 'DISCONNECT') {
		return `${user} left the chat.`;
	}

	return 'null';
}
