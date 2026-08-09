type User = {
  name: string;
  age: number;
  location?: string;
};

const users: User[] = [];

export const addUser = (user: User): void => {
  if (user.age < 0) {
    throw new Error("age must be positive");
  }
  users.push(user);
};

export const getUserByName = (name: string) => {
  return users.find((user) => user.name === name);
};
export const describeUser = (user: User): string => {
  const location = user.location ?? "unknown";
  return `${user.name} (${user.age}) from ${location}`;
};
