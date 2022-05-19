import { createContext, createResource, onCleanup, useContext } from "solid-js";

import { Event, Client } from "pikav";

export const Context = createContext<Client[]>([]);

export function useSubscribe<D, M = unknown>(
  topic: string,
  fn: (event: Event<D, M>) => void,
  clientId?: number,
) {
  const clients = useContext(Context);
  const client = clients[clientId || 0];

  const [resource] = createResource(() => client.subscribe(topic, fn));

  onCleanup(async () => {
    try {
      const unsubscribe = resource();

      if (unsubscribe) {
        await unsubscribe();
      }
    } catch (error) {}
  });
}

export function useClient(clientId?: number): Client {
  const clients = useContext(Context);

  return clients[clientId || 0];
}
