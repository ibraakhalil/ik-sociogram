const bunBinPath = process.env.HOME ? `${process.env.HOME}/.bun/bin` : null;
const sharedPath = [bunBinPath, process.env.PATH].filter(Boolean).join(":");

module.exports = {
  apps: [
    {
      name: "appifylab-social-backend",
      cwd: "/home/ubuntu/appifylab-social/backend",
      script: "bun",
      args: "run start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PATH: sharedPath,
        PORT: "3001",
      },
    },
    {
      name: "appifylab-social-frontend",
      cwd: "/home/ubuntu/appifylab-social/frontend",
      script: "bun",
      args: "run start -- --hostname 0.0.0.0 --port 3000",
      interpreter: "none",
      env: {
        HOSTNAME: "0.0.0.0",
        NODE_ENV: "production",
        PATH: sharedPath,
        PORT: "3000",
      },
    },
  ],
};
