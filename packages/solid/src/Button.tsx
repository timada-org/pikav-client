import { Component, createSignal } from "solid-js";
import {} from "pikav";

const Button: Component = () => {
  const [count, setCount] = createSignal(0);

  return <button onClick={() => setCount(count() + 1)}>Click me {count()}</button>;
};

export default Button;
