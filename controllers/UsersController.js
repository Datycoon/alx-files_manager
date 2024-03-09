import sha1 from 'sha1';
import { ObjectId } from 'mongodb'; // Add this line to import ObjectId
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;
    if (!email) {
      return response.status(400).json({ error: 'Missing email' }); // Return the response
    }
    if (!password) {
      return response.status(400).json({ error: 'Missing password' }); // Return the response
    }

    const hashPwd = sha1(password);

    try {
      const collection = dbClient.db.collection('users');
      const user1 = await collection.findOne({ email });

      if (user1) {
        return response.status(400).json({ error: 'Already exist' }); // Return the response
      }

      await collection.insertOne({ email, password: hashPwd }); // Add await here
      const newUser = await collection.findOne(
        { email },
        { projection: { email: 1 } }
      );
      return response
        .status(201)
        .json({ id: newUser._id, email: newUser.email }); // Return the response
    } catch (error) {
      console.log(error);
      return response.status(500).json({ error: 'Server error' }); // Return the response
    }
  }

  static async getMe(request, response) {
    try {
      const userToken = request.header('X-Token');
      const authKey = `auth_${userToken}`;
      const userID = await redisClient.get(authKey);
      console.log('USER KEY GET ME', userID);
      if (!userID) {
        return response.status(401).json({ error: 'Unauthorized' }); // Return the response
      }
      const user = await dbClient.getUser({ _id: ObjectId(userID) }); // Use ObjectId correctly
      return response.json({ id: user._id, email: user.email }); // Return the response
    } catch (error) {
      console.log(error);
      return response.status(500).json({ error: 'Server error' }); // Return the response
    }
  }
}

export default UsersController;

