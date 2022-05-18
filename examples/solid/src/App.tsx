import { Component, createResource, createSignal, For } from "solid-js";
import { Client } from "pikav";

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const fetchTodos = async () => (await fetch(`/api/todos`)).json();

const App: Component = () => {
  const [inputValue, setInputValue] = createSignal("");
  const [todos, { mutate }] = createResource<Todo[]>(fetchTodos, { initialValue: [] });

  const client = new Client({ url: "http://127.0.0.1:6750/sse", api: "/pikav" });

  client.subscribe("todos/+", (event) => {
    switch (event.name) {
      case "Created":
        mutate((todos) => [...todos, event.data]);
        break;

      case "Updated":
        mutate((todos) => {
          const i = todos.findIndex((todo) => todo.id == event.data.id);

          return [...todos.slice(0, i), Object.assign({}, event.data), ...todos.slice(i + 1)];
        });
        break;

      case "Deleted":
        mutate((todos) => {
          return todos.filter((t) => t.id !== event.data.id);
        });
        break;

      default:
        break;
    }
  });

  // const es = new EventSource("http://127.0.0.1:6750/sse");
  // es.onmessage = (ev) => {
  //   const data = JSON.parse(ev.data);
  //   if (data.topic === "$SYS/session" && data.name === "Created") {
  //     fetch("/pikav/subscribe/todos/+", {
  //       method: "PUT",
  //       headers: new Headers({
  //         "X-Pikav-Session-ID": data.data,
  //       }),
  //     });

  //     return;
  //   }

  //   switch (data.name) {
  //     case "Created":
  //       mutate((todos) => [...todos, data.data]);
  //       break;

  //     case "Updated":
  //       mutate((todos) => {
  //         const i = todos.findIndex((todo) => todo.id == data.data.id);

  //         return [...todos.slice(0, i), Object.assign({}, data.data), ...todos.slice(i + 1)];
  //       });
  //       break;

  //     case "Deleted":
  //       mutate((todos) => {
  //         return todos.filter((t) => t.id !== data.data.id);
  //       });
  //       break;

  //     default:
  //       break;
  //   }
  // };

  return (
    <>
      <input
        type="text"
        value={inputValue()}
        onChange={(e) => setInputValue(e.currentTarget.value)}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            fetch("/api/todos", {
              method: "POST",
              body: JSON.stringify({ text: inputValue() }),
              headers: new Headers({ "Content-Type": "application/json" }),
            });
          }
        }}
      />

      <ul>
        <For each={todos()}>
          {(todo) => (
            <li>
              {todo.text} {todo.done ? "yes" : "no"}
              <button
                onclick={() => {
                  fetch(`/api/todos/${todo.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ text: inputValue(), done: !todo.done }),
                  });
                }}
              >
                Update
              </button>
              <button
                onclick={() => {
                  fetch(`/api/todos/${todo.id}`, {
                    method: "DELETE",
                  });
                }}
              >
                Delete
              </button>
            </li>
          )}
        </For>
      </ul>
    </>
  );
};

export default App;
