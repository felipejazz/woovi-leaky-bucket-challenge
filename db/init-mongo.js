use wooviDatabase;

db.createCollection("Users");

db.User.insertMany([
  {
    username: "user1",
    password: "password1",
    token: "token1",
    bucket: {
      user: "user1",
      tokens: ["tokenA1", "tokenB1"],
      intervalId: null,
      serviceStarted: true
    },
    revokedTokens: ["revokedToken1"]
  },
  {
    username: "user2",
    password: "password2",
    token: "token2",
    bucket: {
      user: "user2",
      tokens: ["tokenA2", "tokenB2"],
      intervalId: null,
      serviceStarted: false
    },
    revokedTokens: ["revokedToken2"]
  },
  {
    username: "user3",
    password: "password3",
    token: "token3",
    bucket: {
      user: "user3",
      tokens: ["tokenA3", "tokenB3"],
      intervalId: null,
      serviceStarted: true
    },
    revokedTokens: ["revokedToken3"]
  }
]);

