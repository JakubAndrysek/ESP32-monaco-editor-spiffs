interface Person {
	firstName: string;
	lastName: string;
}

function greeter(person: Person) {
	return "Hello It is me, " + person.firstName + " " + person.lastName;
}

let user: Person = {
	firstName: "Jane",
	lastName: "Doe"
};

console.log(greeter(user));