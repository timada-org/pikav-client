/* @refresh reload */
import { render } from "solid-js/web";
import { Client, ClientOptions, ClientHeader } from "pikav";
import { Pikav } from "pikav/solid";

import "./index.css";
import App from "./App";

function setCookie(cname: string, cvalue: string, exdays: number) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname: string) {
  const name = cname + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

const ZONE = location.pathname.replace("/", "") || "eu-west-1a";

const clients: { [key: string]: ClientOptions } = {
  "eu-west-1a": { url: "http://127.0.0.1:6750/events", api: "http://127.0.0.1:6750" },
  "eu-west-1b": { url: "http://127.0.0.1:6760/events", api: "http://127.0.0.1:6760" },
  "us-west-1a": { url: "http://127.0.0.1:6770/events", api: "http://127.0.0.1:6770" },
  "eu-west-1a-eu-west-1b": { url: "http://127.0.0.1:6750/events", api: "http://127.0.0.1:6760" },
};

const client_ids: { [key: string]: string } = {
  "eu-west-1a": "john",
  "eu-west-1b": "albert",
  "us-west-1a": "john",
  "eu-west-1a-eu-west-1b": "john",
};

const client = new Client({
  ...clients[ZONE],
  namespace: "example",
  async headers(): Promise<ClientHeader> {
    const clientId = client_ids[ZONE];
    const tokenKey = `pikav_access_token_${clientId}`;
    let token = getCookie(tokenKey);

    if (token) {
      return {
        Authorization: token,
      };
    }
    const options: RequestInit = {
      method: "POST",
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ client_id: clientId }),
    };

    const res = await fetch("/oauth/token", options);
    const data = await res.json();

    token = `${data.token_type} ${data.access_token}`;

    setCookie(tokenKey, token, 1);

    return {
      Authorization: token,
    };
  },
});

render(
  () => (
    <Pikav client={client}>
      <App />
    </Pikav>
  ),
  document.getElementById("root") as HTMLElement,
);
