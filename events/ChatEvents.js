class ChatEvents {
	static USER_MESSAGE = 1;
	static SYSTEM_MESSAGE = 2;
	static CHAT_INIT = 3;
	static COMMAND_MESSAGE = 4;
	static LOGIN_MESSAGE = 5;
	static LOGOUT_MESSAGE = 6;
}

class CommandMessageTypes {
	static INVALID_COMMAND = -1;
	static USERNAME_CHANGE = 1;
	static CLEAR_CHAT = 2;
}

class SystemMessageTypes {
	static USER_CONNECT = 1;
	static USER_DISCONNECT = 2;
	static USER_NAME_CHANGE = 3;
}

class AuthMessageTypes {
	static LOGIN = 1;
	static LOGOUT = 2;
}

export { ChatEvents, CommandMessageTypes, SystemMessageTypes, AuthMessageTypes };
