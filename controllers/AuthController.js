/**
 * Authenticate a user
 */
import { v4 as uuid4 } from 'uuid';
import hash from '../utils/hash.js';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const getConnect = async (req, res) => {
  const Authorization = req.headers.authorization;
  if (!Authorization || !Authorization.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base64Credentials = Authorization.split(' ')[1];
  const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [email, password] = decodedCredentials.split(':');

  const user = await dbClient.users.findOne({ email });
  if (!user || user.password !== hash(password)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = uuid4();
  await redisClient.set(`auth_${token}`, user._id.toString(), 'EX', 60 * 60 * 24);

  return res.status(200).json({ token });
};

const getDisconnect = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const deleted = await redisClient.del(`auth_${token}`);
  if (deleted !== 1) {
    return res.status(500).json({ error: 'Internal server error' });
  }

  return res.status(204).end();
};

export { getConnect, getDisconnect };
