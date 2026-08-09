export const formatUser = (name: string, excited = false) => {
  const greeting = `Hello, ${name}`;
  return excited ? `${greeting}!` : greeting;
};
