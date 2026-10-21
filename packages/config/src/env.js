const required = ['NODE_ENV'];

export function loadEnv(env = process.env) {
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    nodeEnv: env.NODE_ENV,
    port: Number(env.PORT || 3000)
  };
}
