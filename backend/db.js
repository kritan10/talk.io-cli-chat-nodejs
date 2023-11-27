import { Redis } from 'ioredis';

const redis = new Redis();

async function init() {
	// const userCount = await redis.get('user_counter');
	// if (userCount === null) await redis.set('user_counter', 0);

	const msgCount = await redis.get('message_counter');
	if (msgCount === null) await redis.set('message_counter', 0);

	console.log('Redis initialized.');
}

try {
	await init();
} catch (error) {
	console.log(error);
}

/**
 * Adds a message to the redis database.
 * @param {object} message the message
 */
async function saveMessage(message) {
	const id = await redis.incr('message_counter');
	await redis.hset(`message:${id}`, message);
	console.log('MESSAGE INSERTED');
}

async function getPreviousMessages(messages_to_receive = 3) {
	let messages = [];
	const message_count = await redis.get('message_counter');
	if (message_count < 1) return;
	for (let i = message_count - messages_to_receive + 1; i <= message_count; i++) {
		const msg = await redis.hgetall(`message:${i}`);
		if (Object.keys(msg).length === 0) continue;
		messages.push(msg);
	}
	// console.log(messages);
	return messages;
}

async function test() {
	// console.log(await redis.set('foo', 'bar'));
	// console.log(await redis.get('foo'));
	// console.log(await redis.del('foo'));
	// console.log(await redis.del('foo'));
	// await redis.set('counter', 1);
	// console.log(await redis.incr('counter'));
	// console.log(await redis.incr('counter'));
	// console.log(await redis.incr('counter'));
	// console.log(await redis.get('asdf'));
	// const json = JSON.stringify({ mykey: 'value', another: '1' });
	// console.log(await redis.set('json', json));
	// console.log(await redis.get('json'));
	// await redis.set('message_counter', 0);
	// for (let i = 0; i < 5; i++) {
	// 	const id = await redis.incr('message_counter');
	// 	// console.log(id);
	// 	const message = {
	// 		sender: 'user1',
	// 		content: `hello${id}`,
	// 	};
	// 	await redis.hset(`message:${id}`, message);
	// 	console.log('inserted');
	// }
	// const message_count = await redis.get('message_counter'); // 5
	// const messages_to_receive = 3;
	// for (let i = message_count - messages_to_receive + 1; i <= message_count; i++) {
	// 	console.log(await redis.hgetall(`message:${i}`));
	// }
}

test();

export { saveMessage, getPreviousMessages };
