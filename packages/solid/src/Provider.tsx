import { Client } from "pikav";
import { ParentComponent } from "solid-js";
import { Context } from "./hooks";

export interface ProviderProps {
  client: Client | Client[];
}

const Provider: ParentComponent<ProviderProps> = (props) => {
  const clients = !Array.isArray(props.client)
    ? [props.client as Client]
    : (props.client as Client[]);

  return <Context.Provider value={clients}>{props.children}</Context.Provider>;
};

export default Provider;
