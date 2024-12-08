import process from 'node:process';

import { socket } from './socket.js';
import { playMessageReceivedAudio } from './audio.js';
import { addTextAndScrollToBottom, clearOutput, input, output } from './cli.js';
import { ChatEvents, CommandMessageTypes } from '../events/ChatEvents.js';
import {
  INVALID_COMMAND_STRING,
  LOGIN_FAIL_STRING,
  LOGIN_NOT_REQUIRED_STRING,
  LOGIN_PROMPT_STRING,
  LOGOUT_SUCCESS_STRING,
  NOT_LOGGED_IN_MESSAGE,
  SERVER_UNREACHABLE_STRING,
} from './strings.js';
import { createUserMessageString, createSystemMessageString } from './strings.js';

let username = null;

socket.on(ChatEvents.LOGIN_MESSAGE, (success, mUsername) => {
  if (success) {
    username = mUsername;
    startChat();
    socket.emit(ChatEvents.CHAT_INIT, { username: username, timestamp: new Date().toDateString() });
    return;
  }
  if (username) {
    addTextAndScrollToBottom(`${LOGIN_NOT_REQUIRED_STRING} ${username}`);
    return;
  }
  output.pushLine(LOGIN_FAIL_STRING);
});

function startChat() {
  // on-user-message-received
  socket.on(ChatEvents.USER_MESSAGE, (message) => {
    addTextAndScrollToBottom(createUserMessageString(message, username));
    playMessageReceivedAudio();
  });

  // on-system-message-received
  socket.on(ChatEvents.SYSTEM_MESSAGE, (message, args) => {
    addTextAndScrollToBottom(createSystemMessageString(message, args));
  });

  //on-command-message-received
  socket.on(ChatEvents.COMMAND_MESSAGE, (command) => {
    switch (command.type) {
      case CommandMessageTypes.USERNAME_CHANGE:
        username = command.newName;
        break;

      case CommandMessageTypes.CLEAR_CHAT:
        clearOutput();
        break;

      case CommandMessageTypes.INVALID_COMMAND:
        addTextAndScrollToBottom(INVALID_COMMAND_STRING);
        break;

      default:
        addTextAndScrollToBottom(INVALID_COMMAND_STRING);
        break;
    }
  });

  socket.on(ChatEvents.LOGOUT_MESSAGE, () => {
    username = null;
    clearOutput(true);
    addTextAndScrollToBottom(LOGOUT_SUCCESS_STRING);
    output.pushLine(LOGIN_PROMPT_STRING);
    socket.removeAllListeners();
  });

  socket.on(ChatEvents.CHAT_INIT, () => {
    clearOutput();
  });
}

// on-user-press-enter
// main method where all user input is handled
input.key('enter', inputHandler);

async function inputHandler() {
  const userInput = input.getValue();

  // refocus input because blessed
  input.focus();

  if (!userInput) return;

  // reset input field
  input.clearValue();

  if (socket.disconnected) {
    addTextAndScrollToBottom(SERVER_UNREACHABLE_STRING);
    return;
  }

  // check if the user input is a command
  if (userInput.startsWith('/')) {
    // check for login command
    if (userInput.startsWith('/login')) {
      const [_, inputUsername, inputPassword] = userInput.split(' ');
      if (!inputUsername) {
        output.pushLine('Username is required but was not found');
        return;
      }
      if (!inputPassword) {
        output.pushLine('Password is required but was not found');
        return;
      }
      socket.emit(ChatEvents.LOGIN_MESSAGE, { username: inputUsername, password: inputPassword });
      return;
    }

    // check for logout
    if (userInput.startsWith('/logout')) {
      socket.emit(ChatEvents.LOGOUT_MESSAGE);
      return;
    }

    if (userInput.startsWith('/exit')) {
      socket.close();
      process.exit(1);
    }

    const command = userInput;
    socket.emit(ChatEvents.COMMAND_MESSAGE, command);
    return;
  }

  if (username === null) {
    output.pushLine(NOT_LOGGED_IN_MESSAGE);
    return;
  }

  // parse message
  const message = {
    content: userInput,
    sender: username,
    sendTime: new Date().toString().split(' ')[4],
  };
  addTextAndScrollToBottom(createUserMessageString(message, username));
  socket.emit(ChatEvents.USER_MESSAGE, message);
}
