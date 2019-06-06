const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");

const typeDefs = gql`
  extend type Query {
    # *** THIS DOESN'T WORK ***
    #
    # The error: uses the @provides directive but 'Query.searchProducts' returns '[Product!]!', which is not an Object type. @provides can only be used on Object types with at least one @key.
    #
    # Can the gateway look at the ObjectType inside the GraphQLList?
    searchProducts(term: String!): [Product!]! @provides(fields: "name")
  }

  extend type Product @key(fields: "upc") {
    upc: String! @external
    name: String @external
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
