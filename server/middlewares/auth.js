const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
  req.user = decodedToken;
  next();
};
