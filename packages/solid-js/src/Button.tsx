import { Component } from "solid-js";
import { useCount } from "pikav";

const Button: Component = () => {
  const [count, { setCount }] = useCount();

  return <button onClick={() => setCount(count() + 1)}>Try click {count()}</button>;
};

export default Button;
