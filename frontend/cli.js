import process from 'node:process';
import blessed from 'blessed';
import chalk from 'chalk';

// cli-screen
const screen = blessed.screen({
	smartCSR: true,
	title: 'My Chat App',
	cursor: {
		artificial: true,
		shape: 'line',
		blink: true,
		color: null, // null for default
	},
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
		border: {
			fg: '#f0f0f0',
		},
	},
	scrollable: true,
	scrollbar: { style: { bg: 'white' } },
	alwaysScroll: true,
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

screen.append(output);
screen.append(input);
input.focus();
const a = chalk.bold.bgBlue('To login, type /login <username>');
output.addItem(a);
// Event handler for Ctrl+C to exit the program
screen.key(['C-c'], () => {
	return process.exit(0);
});
input.key(['C-c'], () => {
	return process.exit(0);
});
input.ileft;

screen.render();

function refreshScreen(clearInput = true) {
	if (clearInput) input.clearValue();
	input.focus();
	screen.render();
}

export { input, output, screen, refreshScreen };
