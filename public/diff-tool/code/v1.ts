type User = {
  name: string;
  age: number;
};

const users: User[] = [];

export const addUser = (user: User): void => {
  users.push(user);
};

export const findUser = (name: string) => {
  return users.find((user) => user.name === name);
};
export const describeUser = (user: User): string => {
  return `${user.name} is ${user.age} years old`;
};
