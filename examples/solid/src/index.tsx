/* @refresh reload */
import { render } from "solid-js/web";
import { Client } from "pikav";
import { Provider } from "pikav/solid";

import "./index.css";
import App from "./App";
import CheckAuth from "./CheckAuth";

const client = new Client({ url: "http://127.0.0.1:6750/sse", api: "/pikav" });

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
