const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");

const typeDefs = gql`
  extend type Query {
    topProducts(first: Int = 5): [Product]
  }

  interface Product @key(fields: "id") {
    id: ID!
    name: String
    price: Int
  }

  type Book implements Product @key(fields: "id") {
    id: ID!
    name: String
    price: Int
    pages: Int
  }

  type Furniture implements Product @key(fields: "id") {
    id: ID!
    name: String
    price: Int
    weight: Int
  }
`;

const resolvers = {
  Product: {
    __resolveReference(object) {
      return products.find(product => product.id === object.id);
    },
    __resolveType(object) {
      return object.pages ? 'Book' : 'Furniture'
    }
  },

  // Duplicating the reference resolvers is unfortunate, but representations
  // will always use a concrete type in the __typename field.
  Book: {
    __resolveReference(object) {
      return products.find(product => product.id === object.id);
    },
  },
  Furniture: {
    __resolveReference(object) {
      return products.find(product => product.id === object.id);
    },
  },

  Query: {
    topProducts(_, args) {
      return products.slice(0, args.first);
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

server.listen({ port: 4003 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const products = [
  {
    id: "1",
    name: "Table",
    price: 899,
    weight: 100
  },
  {
    id: "2",
    name: "Couch",
    price: 1299,
    weight: 1000
  },
  {
    id: "3",
    name: "Chair",
    price: 54,
    weight: 50
  },
  {
    id: "4",
    name: "1984",
    price: 899,
    pages: 150
  },
  {
    id: "5",
    name: "Animal Farm",
    price: 1299,
    weight: 50
  }
];
