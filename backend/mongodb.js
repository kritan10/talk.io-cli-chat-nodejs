import mongoose from 'mongoose';

export async function initMongoose() {
  await mongoose.connect('mongodb://127.0.0.1:27017/talkio');
}

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

export const User = mongoose.model('User', userSchema);
