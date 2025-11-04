const { logWrite } = require('./logfile');
const { payloadencrypt } = require('./payloadCrypto');

const checkAccess = (allowedRoles = [], checkOwnership = false) => {
  return (req, res, next) => {
    if (!req.user) {
      logWrite('Access check failed: no user in request');
      return res.status(403).json({ data: payloadencrypt(JSON.stringify({ msg: 'Access denied. No user info.' }))});
    }

    const { role_id, id: userId } = req.user;

    // If role is in allowedRoles → access granted
    if (allowedRoles.includes(role_id)) {
      return next();
    }

    // If ownership check is enabled → user can only access their own id
    if (checkOwnership) {
      // Assume the target user id comes from params, e.g., /profile/:id
      const targetId = req.params.id || req.body.id;
      if (targetId && targetId.toString() === userId.toString()) {
        return next();
      } else {
        logWrite(`Access denied: user ${userId} tried to access ${targetId}`);
        return res.status(403).json({ data: payloadencrypt(JSON.stringify({ msg: 'Access denied. Cannot access other users data.' }))});
      }
    }

    // Default deny
    logWrite(`Access denied: user ${userId} with role ${role_id}`);
    return res.status(403).json({ data: payloadencrypt(JSON.stringify({ msg: 'Access denied. Insufficient permissions.' }))});
  };
};

module.exports = { checkAccess };