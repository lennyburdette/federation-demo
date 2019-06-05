const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");

const typeDefs = gql`
  extend type Query {
    searchProducts(term: String!): [Product!]!
  }

  extend type Product @key(fields: "upc") {
    upc: String! @external
  }
`;

const resolvers = {
  Query: {
    searchProducts(_, { term }) {
      return products.filter(p => p.name.toLowerCase().includes(term.toLowerCase()));
    }
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers
    }
  ])
});

server.listen({ port: 4005 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const products = [
  {
    upc: "1",
    name: "Table"
  },
  {
    upc: "2",
    name: "Couch"
  },
  {
    upc: "3",
    name: "Chair"
  }
];
