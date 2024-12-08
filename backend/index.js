import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import argon2 from 'argon2';
import { getPreviousMessages, saveMessage } from './db.js';
import { ChatEvents, CommandMessageTypes, SystemMessageTypes } from '../events/ChatEvents.js';
import { initMongoose, User } from './mongodb.js';

const app = express();
const server = createServer(app);
const io = new Server(server);

let connectedUsers = [];

io.on('connection', async (socket) => {
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
    socket.emit(ChatEvents.CHAT_INIT);
    const prevMessages = await getPreviousMessages(5);
    prevMessages?.forEach((message) => {
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

  socket.on(ChatEvents.LOGIN_MESSAGE, async (user, ackcb) => {
    const elUser = await User.findOne({ username: user.username }).exec();
    if (!elUser) {
      const newUser = new User({ username: user.username, password: await argon2.hash(user.password) });
      await newUser.save();
    } else {
      const isPasswordMatch = await argon2.verify(elUser.password, user.password);
      if (!isPasswordMatch) {
        socket.emit(ChatEvents.LOGIN_MESSAGE, false, null);
        return ackcb();
      }
    }
    const isUserConnected = connectedUsers.find((u) => u.username === user.username || u.id === socket.id);
    if (isUserConnected) {
      socket.emit(ChatEvents.LOGIN_MESSAGE, false, null);
      return ackcb();
    }
    connectedUsers.push({ username: user.username, id: socket.id });
    socket.emit(ChatEvents.LOGIN_MESSAGE, true, user.username);
    ackcb();
  });

  socket.on(ChatEvents.LOGOUT_MESSAGE, (ackcb) => {
    const user = connectedUsers.find((user) => user.id === socket.id);
    connectedUsers = connectedUsers.filter((user) => user.id !== socket.id);
    console.log(connectedUsers);
    if (user) io.emit(ChatEvents.SYSTEM_MESSAGE, SystemMessageTypes.USER_DISCONNECT, [user.username]);
    ackcb();
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.find((user) => user.id === socket.id);
    connectedUsers = connectedUsers.filter((user) => user.id !== socket.id);
    // console.log(users);
    if (user) io.emit(ChatEvents.SYSTEM_MESSAGE, SystemMessageTypes.USER_DISCONNECT, [user.username]);
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

initMongoose().then(() => {
  server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
  });
});
