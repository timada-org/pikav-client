import TopicFilter from "./topic";

type ClientHeader = { [key: string]: unknown };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ListenerFunc = (event: any) => void;

export interface Event<D = unknown, M = unknown> {
  topic: string;
  name: string;
  data: D;
  metadata?: M;
}

export interface ClientOptions {
  url: string;
  api?: string;
  namespace?: string;
  request?: RequestInit;
  headers?: ClientHeader | (() => ClientHeader) | (() => Promise<ClientHeader>);
}

export default class Client {
  options: ClientOptions;
  clientId?: string;
  listeners: Map<string, [TopicFilter, ListenerFunc]>;
  es: EventSource;

  constructor(options: ClientOptions) {
    this.options = {
      api: options.url,
      ...options,
    };

    this.listeners = new Map();
    this.es = new EventSource(this.options.url);

    this.es.onopen = () => {
      delete this.clientId;
      this.subscribeListeners();
    };

    this.es.onmessage = (e) => {
      if (e.data === "ping") {
        return;
      }

      const event: Event<string> = JSON.parse(e.data);

      if (event.topic === "$SYS/session" && event.name === "Created") {
        this.clientId = event.data;
      }

      this.listeners.forEach(([filter, fn]) => {
        if (filter.match(event.topic)) {
          fn(event);
        }
      });
    };
  }

  get namespace(): string {
    return this.options.namespace || "_";
  }

  async getClientId(): Promise<string> {
    return new Promise((resolve) => {
      const fn = () => {
        if (!this.clientId) {
          requestAnimationFrame(fn);

          return;
        }

        resolve(this.clientId);
      };

      fn();
    });
  }

  async fetch(
    method: string,
    path: string,
  ): Promise<{
    status: number;
    data: unknown;
  }> {
    const clientId = await this.getClientId();
    const headers = await this.headers();

    let options: RequestInit = {
      method,
      headers: new Headers({
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Pikav-Client-ID": clientId,
        ...headers,
      }),
    };

    if (this.options.request) {
      options = { ...options, ...this.options.request };
    }

    try {
      const res = await fetch(`${this.options.api}/${path}`, options);
      const data = await res.json();

      if (!res.ok) {
        throw data;
      }

      return data;
    } catch (error) {
      throw { code: 0, message: error };
    }
  }

  async subscribe(filter: string, fn: ListenerFunc): Promise<() => Promise<void>> {
    await this.fetch("PUT", `subscribe/${this.namespace}/${filter}`);

    try {
      this.listeners.set(filter, [new TopicFilter(filter), fn]);
    } catch (error) {
      console.error(error);
    }

    return async (): Promise<void> => {
      this.listeners.delete(filter);

      await this.fetch("PUT", `unsubscribe/${this.namespace}/${filter}`);
    };
  }

  async subscribeListeners(): Promise<void> {
    if (this.listeners.size > 0) {
      await Promise.all(
        Array.from(this.listeners).map(([filter]) => this.fetch("PUT", `subscribe/${filter}`)),
      );
    }
  }

  async headers(): Promise<{ [key: string]: unknown } | null> {
    if (!this.options.headers) {
      return null;
    }

    if (typeof this.options.headers === "object") {
      return this.options.headers;
    }

    if (typeof this.options.headers !== "function") {
      throw new Error("Invalid headers");
    }

    const res = this.options.headers();

    if (res instanceof Promise) {
      return await res;
    }

    return res;
  }
}
