export type AuthUser = {
  email: string;
  userId: string;
};

export type AppEnv = {
  Variables: {
    authUser: AuthUser;
  };
};
