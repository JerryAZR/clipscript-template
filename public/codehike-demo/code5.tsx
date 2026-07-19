// !focus(8:9)
const user = {
	name: "Lorem",
	age: 26,
	location: "Ipsum",
};

// !mark(1:1) 40 15
console.log(user.name);
// !diff(1:1) +
console.log(user.location); // !callout[18:26] added in this step
