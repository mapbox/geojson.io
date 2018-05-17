import React from "react";
import ReactDOM from "react-dom";
import { Provider, Subscribe } from "unstated";
import Help from "./panel/help";
import LayerSwitch from "./ui/layer_switch";
import FileBar from "./ui/file_bar";
import ModeButtons from "./ui/mode_buttons";
import User from "./ui/user";
import Map from "./ui/map";
import Panel from "./panel/index";
import StateContainer from "./state";
import ApolloClient from "apollo-client";
import { createHttpLink } from "apollo-link-http";
import { ApolloLink } from "apollo-link";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloProvider } from "react-apollo";

const middlewareLink = new ApolloLink((operation, forward) => {
  operation.setContext({
    headers: {
      authorization: `bearer ${localStorage.getItem("githubToken")}`
    }
  });
  return forward(operation);
});

let httpLink = middlewareLink.concat(
  createHttpLink({ uri: "https://api.github.com/graphql" })
);

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache().restore(window.__APOLLO_STATE__)
});

// networkInterface.use([
//   {
//     applyMiddleware(req, next) {
//       if (!req.options.headers) {
//         req.options.headers = {}; // Create the header object if needed.
//       }
//
//       // Send the login token in the Authorization header
//       req.options.headers.authorization = `Bearer ${TOKEN}`;
//       next();
//     }
//   }
// ]);

ReactDOM.render(
  <Provider>
    <ApolloProvider client={client}>
      <div className="vh-100 flex sans-serif black-70">
        <div className="w-50 flex flex-column">
          <div className="bg-white pt2 ph2 flex justify-between">
            <Subscribe to={[StateContainer]}>
              {({ state: { geojson }, setGeojson }) => (
                <FileBar geojson={geojson} setGeojson={setGeojson} />
              )}
            </Subscribe>
          </div>
          <Subscribe to={[StateContainer]}>
            {({ state: { layer, geojson }, setGeojson }) => (
              <Map layer={layer} geojson={geojson} setGeojson={setGeojson} />
            )}
          </Subscribe>
          <LayerSwitch />
        </div>
        <div className="w-50 bl b--black-10 bg-light-gray flex flex-column">
          <div
            className="bg-white pt2 ph2 flex justify-between bb b--black-20"
            style={{
              flexShrink: 0
            }}
          >
            <ModeButtons />
            <User />
          </div>
          <Panel />
        </div>
      </div>
    </ApolloProvider>
  </Provider>,
  document.getElementById("geojsonio")
);
