const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");

const typeDefs = gql`
  extend interface Product {
    inStock: Boolean
  }

  extend type Book implements Product @key(fields: "id") {
    id: ID! @external
    inStock: Boolean
  }

  extend type Furniture implements Product @key(fields: "id") {
    id: ID! @external
    price: Int @external
    weight: Int @external
    inStock: Boolean
    shippingEstimate: Int @requires(fields: "price weight")
  }
`;

const resolvers = {
  Book: {
    __resolveReference(object) {
      return {
        ...object,
        ...inventory.find(product => product.id === object.id)
      };
    }
  },
  Furniture: {
    __resolveReference(object) {
      return {
        ...object,
        ...inventory.find(product => product.id === object.id)
      };
    },
    shippingEstimate(object) {
      // free for expensive items
      if (object.price > 1000) return 0;
      // estimate is based on weight
      return object.weight * 0.5;
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

server.listen({ port: 4004 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const inventory = [
  { id: "1", inStock: true },
  { id: "2", inStock: false },
  { id: "3", inStock: true },
  { id: "4", inStock: true },
  { id: "5", inStock: false }
];
