import { SystemMessageTypes } from '../events/ChatEvents.js';

export const LOGIN_PROMPT_STRING = '{blue-bg}{bold}To login, type /login <username>{/}';
export const LOGIN_SUCCESS_STRING = 'Logged in as';
export const LOGIN_FAIL_STRING = 'Username already taken. Try a different one.';
export const LOGIN_NOT_REQUIRED_STRING = 'You are currently logged in as.';

export const WELCOME_STRING = '{blue-bg}{bold}welcome to talk.io: the cli chat{/}';

export const NOT_LOGGED_IN_MESSAGE = 'You need to be logged in to send messages.';
export const LOGOUT_SUCCESS_STRING = 'Logged out.';

export const INVALID_COMMAND_STRING = '{red-bg}Invalid command.{/}';
export const SERVER_UNREACHABLE_STRING = '{red-bg}Could not connect with the server.{/}';
export const ATTEMPT_SERVER_CONNECTION_STRING = '{blue-bg}Trying to establish connection. Press Ctrl-C to exit.{/}';

/**
 * Method to format message object to string which can be displayed in the console.
 * @param {UserMessage} message the message object
 * @param {string} currentUser the username of the currently logged in user
 * @returns a string version of message in '[HH:MM:SS] sender_name: content' form
 */
export function createUserMessageString(message, currentUser) {
	const { sendTime, sender, content } = message;
	const formattedSenderString = `${sender == currentUser ? '{green-bg}' : '{blue-bg}'}${sender}{/}`;
	const textContent = `{gray-fg}[${sendTime}]{/gray-fg} ${formattedSenderString}: ${content}`;
	return textContent;
}

/**
 * Method to parse and format SystemMessage to string object which can be displayed in the console.
 * @param {SystemMessageTypes} msg the type of the system message
 * @param {string[]} args arguments
 * @returns a string version of system message
 */
export function createSystemMessageString(msg, args) {
	if (msg === SystemMessageTypes.USER_CONNECT) {
		const user = args[0];
		return `{gray-fg}${user} joined the chat.{/}`;
	}

	if (msg === SystemMessageTypes.USER_DISCONNECT) {
		const user = args[0];
		return `{gray-fg}${user} left the chat.{/}`;
	}

	if (msg === SystemMessageTypes.USER_NAME_CHANGE) {
		const previousName = args[0];
		const newName = args[1];
		return `{gray-fg}${previousName} changed their name to ${newName}{/}`;
	}

	return '{gray-fg}-----{/}';
}
