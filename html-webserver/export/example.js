function greeter(person) {
    return "Hello It is me, " + person.firstName + " " + person.lastName;
}
var user = {
    firstName: "Jane",
    lastName: "Doe"
};
console.log(greeter(user));
