import { Component, createResource, For, JSX } from "solid-js";
import { useSubscribe, useClient } from "pikav/solid";

import "./App.css";

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface TodoItem {
  data: Todo;
  disabled: boolean;
}

const DEFAULT_ZONE = location.pathname.replace("/", "") || "eu-west-1a";
const ZONES: { [key: string]: string } = {
  "eu-west-1a-eu-west-1b": "eu-west-1b",
};
const ZONE = ZONES[DEFAULT_ZONE] || DEFAULT_ZONE;

const App: Component = () => {
  const client = useClient();
  const fetchTodos = async () => {
    const headers = (await client.headers()) as {
      [key: string]: string;
    };
    const resp = await fetch(`/api-${ZONE}/todos`, {
      headers: new Headers({
        "Content-Type": "application/json",
        ...headers,
      }),
    });
    const data: Todo[] = await resp.json();

    return data.map((todo) => ({ data: todo, disabled: false }));
  };

  const [todos, { mutate }] = createResource<TodoItem[]>(fetchTodos, { initialValue: [] });

  useSubscribe<Todo>("todos/*", (event) => {
    switch (event.name) {
      case "Created":
        mutate((todos) => {
          const i = todos.findIndex(
            (todo) => todo.data.id === -1 && todo.data.text == event.data.text,
          );
          return [
            ...todos.slice(0, i),
            Object.assign({ data: event.data, disabled: false }),
            ...todos.slice(i + 1),
          ];
        });
        break;

      case "Updated":
        mutate((todos) => {
          const i = todos.findIndex((todo) => todo.data.id == event.data.id);

          return [
            ...todos.slice(0, i),
            { data: event.data, disabled: false },
            ...todos.slice(i + 1),
          ];
        });
        break;

      default:
        break;
    }
  });

  useSubscribe<Todo>("todos/*", (event) => {
    console.log(event);
  });

  const onTodoChange = async (todo: Todo, i: number) => {
    const headers = (await client.headers()) as {
      [key: string]: string;
    };

    mutate((todos) => {
      return [
        ...todos.slice(0, i),
        Object.assign({ data: todo, disabled: true }),
        ...todos.slice(i + 1),
      ];
    });

    if (todo.text === "") {
      if (todo.id > -1) {
        fetch(`/api-${ZONE}/todos/${todo.id}`, {
          method: "DELETE",
          headers: new Headers({
            "Content-Type": "application/json",
            ...headers,
          }),
        });
      }

      mutate((todos) => {
        const newValues = [...todos];
        newValues.splice(i, 1);

        return newValues;
      });

      return;
    }

    if (todo.id > -1) {
      fetch(`/api-${ZONE}/todos/${todo.id}`, {
        method: "PUT",
        body: JSON.stringify({ text: todo.text, done: todo.done }),
        headers: new Headers({
          "Content-Type": "application/json",
          ...headers,
        }),
      });

      return;
    }

    fetch(`/api-${ZONE}/todos`, {
      method: "POST",
      body: JSON.stringify({ text: todo.text }),
      headers: new Headers({
        "Content-Type": "application/json",
        ...headers,
      }),
    });
  };

  const onTodoAdd = () => {
    mutate((todos) => [...todos, { data: { id: -1, text: "", done: false }, disabled: false }]);
  };

  return (
    <div class="app">
      <div class="app__container">
        <ul class="app__todos">
          <For each={todos()}>
            {(item, i) => (
              <Todo
                todo={item.data}
                disabled={item.disabled}
                onChange={(todo) => onTodoChange(todo, i())}
              />
            )}
          </For>
          <button class="app__add-btn" onclick={onTodoAdd}>
            +
          </button>
        </ul>
      </div>
    </div>
  );
};

interface TodoProps {
  todo: Todo;
  onChange: (todo: Todo) => void;
  disabled: boolean;
}

const Todo: Component<TodoProps> = (props) => {
  const onInputChange: JSX.EventHandlerUnion<HTMLInputElement, Event> = (e) => {
    if (props.disabled) {
      return;
    }

    if (props.todo.id === -1 || e.currentTarget.value !== props.todo.text) {
      props.onChange({ ...props.todo, text: e.currentTarget.value });
    }
  };

  const onInputBlur: JSX.EventHandlerUnion<HTMLInputElement, Event> = (e) => {
    if (props.disabled) {
      return;
    }

    if (props.todo.id === -1 && e.currentTarget.value === props.todo.text) {
      props.onChange({ ...props.todo, text: e.currentTarget.value });
    }
  };

  const onButtonClick: JSX.EventHandlerUnion<HTMLButtonElement, Event> = () => {
    if (!props.disabled && props.todo.id > -1) {
      props.onChange({ ...props.todo, done: !props.todo.done });
    }
  };

  return (
    <li class="todo" classList={{ todo_done: props.todo.done, todo_disabled: props.disabled }}>
      <div class="todo__input">
        <input
          type="text"
          value={props.todo.text}
          onchange={onInputChange}
          onblur={onInputBlur}
          readonly={props.disabled}
          placeholder="enter your text here"
        />
      </div>
      <button class="todo__done-btn" disabled={props.disabled} onClick={onButtonClick}></button>
    </li>
  );
};

export default App;
