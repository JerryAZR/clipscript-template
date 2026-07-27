type User = {
  name: string;
  age: number;
  // !diff(1:1) +
  location?: string;
};

const users: User[] = [];

export const addUser = (user: User): void => {
  // !diff(1:3) +
  if (user.age < 0) {
    throw new Error("age must be positive");
  }
  users.push(user);
};

export const getUserByName = (name: string) => {  // !from export const findUser = (name: string) => {
  return users.find((user) => user.name === name);
};
export const describeUser = (user: User): string => {
  // !diff(1:1) -
  return `${user.name} is ${user.age} years old`;
  // !diff(1:2) +
  const location = user.location ?? "unknown";
  return `${user.name} (${user.age}) from ${location}`;
};
