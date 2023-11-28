import process from 'node:process';
import blessed from 'blessed';
import { LOGIN_PROMPT_STRING, WELCOME_STRING } from './strings.js';

// cli-screen
const screen = blessed.screen({
	smartCSR: true,
	title: 'talk.io - CLI chat app',
	cursor: {
		artificial: true,
		shape: 'line',
		blink: true,
		color: null, // null for default
	},
});

// messages-output
const output = blessed.box({
	top: 0,
	left: 0,
	width: '100%',
	height: '800',
	tags: true,
	border: {
		type: 'line',
	},
	style: {
		border: {
			fg: '#f0f0f0',
		},
		scrollbar: {
			bg: 'yellow',
		},
	},
	scrollable: true,
	alwaysScroll: true,
	scrollbar: {
		ch: ' ',
		inverse: true,
	},
});
// text-input/
const input = blessed.textbox({
	bottom: 0,
	left: 0,
	width: '100%',
	height: '200',
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

screen.append(output);
screen.append(input);
input.focus();
output.pushLine(LOGIN_PROMPT_STRING);

// Event handler for Ctrl+C to exit the program
screen.key(['C-c'], () => {
	return process.exit(0);
});
input.key(['C-c'], () => {
	return process.exit(0);
});

screen.render();

function clearInput(clearInput = true) {
	if (clearInput) input.clearValue();
	input.focus();
	screen.render();
}

function focusInput() {
	screen.focusPop();
	input.focus();
}

function clearOutput(removeTitle = false) {
	output.setContent('');
	// output.clearItems();
	if (!removeTitle) {
		output.pushLine(WELCOME_STRING);
		output.pushLine('');
	}
	screen.render();
}

function scrollToBottom() {
	output.scroll(output.getScrollHeight());
	screen.render();
}

function addTextAndScrollToBottom(text) {
	output.pushLine(text);
	scrollToBottom();
}

export { input, output, screen, clearInput, clearOutput, focusInput, scrollToBottom, addTextAndScrollToBottom };
