const hello = () => {
  console.log("Hello, world!");
};

setInterval(hello, 1000);
const goodbye = () => {
  console.log("Goodbye, world!");
  setTimeout(goodbye, 5000);
};
