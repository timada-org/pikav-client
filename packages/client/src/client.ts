export type ClientHeader = { [key: string]: unknown };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ListenerFunc = (event: any) => void;

export interface Event<D = unknown, M = unknown> {
  topic: string;
  name: string;
  data: D;
  metadata?: M;
  filters?: string[];
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
  listeners: Map<number, [string, ListenerFunc]>;
  es: EventSource;
  next_listener_id: number;

  constructor(options: ClientOptions) {
    this.options = {
      api: options.url,
      ...options,
    };

    this.listeners = new Map();
    this.next_listener_id = 0;
    this.es = new EventSource(this.options.url);

    this.es.onmessage = (e) => {
      if (e.data === "ping") {
        return;
      }

      const event: Event<string> = JSON.parse(e.data);

      if (event.topic === "$SYS/session" && event.name === "Created") {
        if (this.clientId) {
          this.subscribeListeners();
        }
        this.clientId = event.data;
      }

      this.listeners.forEach(([filter, fn]) => {
        if (event.filters?.includes(filter)) {
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
    const nsFilter = `${this.namespace}/${filter}`;
    const id = this.next_listener_id++;
    const subscribed = [...this.listeners.values()].some(([filter]) => filter === nsFilter);

    this.listeners.set(id, [nsFilter, fn]);

    if (!subscribed) {
      await this.fetch("PUT", `subscribe/${nsFilter}`);
    }

    return async (): Promise<void> => {
      this.listeners.delete(id);

      const filters = [...this.listeners.values()].filter(([filter]) => filter === nsFilter);

      if (filters.length === 0) {
        await this.fetch("PUT", `unsubscribe/${nsFilter}`);
      }
    };
  }

  async subscribeListeners(): Promise<void> {
    if (this.listeners.size > 0) {
      const filters = [...new Set(Array.from(this.listeners).map(([, [f]]) => f))];
      await Promise.all(filters.map((filter) => this.fetch("PUT", `subscribe/${filter}`)));
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
