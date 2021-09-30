const getUserByEmail = function(email, database) {
  for (let userID in database) {
    const user = database[userID];
    if (email === user.email) {
      return user;
    }
  }
  return undefined;
};
module.exports = getUserByEmail;