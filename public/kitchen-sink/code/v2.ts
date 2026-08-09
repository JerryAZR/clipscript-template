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

export const removeUser = (name: string): void => {
  const index = users.findIndex((user) => user.name === name);
  if (index >= 0) {
    users.splice(index, 1);
  }
};

export const findUser = (name: string): User | undefined => {
  return users.find((user) => user.name === name);
};

export const describeUser = (user: User): string => {
  const location = user.location ? ` from ${user.location}` : "";
  return `${user.name} is ${user.age} years old${location}`;
};

export const listUsers = (): string[] => {
  return users.map(describeUser);
};
