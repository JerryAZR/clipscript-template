type User = {
  name: string;
  age: number;
};

const users: User[] = [];

export const addUser = (user: User): void => {
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
  return `${user.name} is ${user.age} years old`;
};

export const listUsers = (): string[] => {
  return users.map(describeUser);
};
