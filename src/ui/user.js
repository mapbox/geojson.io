import React from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";

export default () => (
  <Query
    query={gql`
      {
        viewer {
          login
          avatarUrl
        }
      }
    `}
  >
    {({ loading, error, data }) => {
      if (loading) return <span>...</span>;
      if (error) return <a href={`${config.authService}/login`}>log in</a>;
      return (
        <div className="inline-flex">
          <img src={data.viewer.avatarUrl} className="w1 h1 mr1" />
          {data.viewer.login}
        </div>
      );
    }}
  </Query>
);
