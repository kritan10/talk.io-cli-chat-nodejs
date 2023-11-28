# talk.io - A CLI based chat app

talk.io is a command-line chat application built using socket.io and blessed.

### backend

-   The backend is a express server with Socket.io and Redis.

### frontend

-   The frontend is CLI application built using the blessed library.

## Features

-   Built using event driven architecture (events and listeners)
-   Send and receive messages in the CLI
-   Fast and reliable communication using Socket.IO library
-   Message storage using Redis

### Instructions to run

##### For backend
- Start a redis server at default port.
- From the root working directory:
```sh
npm run server
```

##### For client
- From the root working directory:
```sh
npm run client
```

##### Using the client
###### Available commands:
- `/login <username>` : log in with given username
- `/clear` : clear the chat
- `/logout` :  log out
- `/exit` : exit the app


