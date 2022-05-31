/* @refresh reload */
import { render } from "solid-js/web";
import { Client, ClientOptions } from "pikav";
import { Provider } from "pikav/solid";

import "./index.css";
import App from "./App";
import CheckAuth from "./CheckAuth";

const ZONE = location.pathname.replace("/", "") || "eu-west-1a";

const clients: { [key: string]: ClientOptions } = {
  "eu-west-1a": { url: "http://127.0.0.1:6750/sse", api: "/pikav-eu-west-1a" },
  "eu-west-1b": { url: "http://127.0.0.1:6751/sse", api: "/pikav-eu-west-1b" },
  "eu-west-1c": { url: "http://127.0.0.1:6752/sse", api: "/pikav-eu-west-1c" },
  "us-west-1a": { url: "http://127.0.0.1:6753/sse", api: "/pikav-us-west-1a" },
};

const client = new Client(clients[ZONE]);

render(
  () => (
    <Provider client={client}>
      <CheckAuth>
        <App />
      </CheckAuth>
    </Provider>
  ),
  document.getElementById("root") as HTMLElement,
);
