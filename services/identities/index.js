const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const pkg = require('./package.json');
const config = require('../../config.json');

const { port } = config.services.find(s => s.name === pkg.name);

const typeDefs = gql`
  extend type Query {
    merchant(id: ID!): Merchant
    location(id: ID!): Location
  }

  type Merchant @key(fields: "id") {
    id: ID!
    name: String!
    locations: [Location!]!
  }

  type Location @key(fields: "id") {
    id: ID!
    name: String!
    merchant: Merchant
  }

  type PlatformAccount @key(fields: "id") {
    id: ID!
    name: String!
    merchants: [Merchant!]!
  }
`;

const resolvers = {
  Query: {
    merchant(_, { id }) {
      return merchants.find(m => m.id === id);
    },
    location(_, { id }) {
      return locations.find(m => m.id === id);
    }
  },
  Merchant: {
    __resolveReference({ id }) {
      return merchants.find(m => m.id === id);
    },
    locations(merchant) {
      return locations.filter(l => l.merchantId === merchant.id);
    }
  },
  Location: {
    __resolveReference({ id }) {
      return locations.find(l => l.id === id);
    },
    merchant(location) {
      return merchants.find(m => location.merchantId === m.id);
    }
  },
  PlatformAccount: {
    __resolveReference({ id }) {
      return platformAccounts.get(id);
    },
    merchants(platformAccount) {
      return platformToMerchantIds.get(platformAccount.id).map(merchantId =>
        ({ __typename: 'Merchant', id: merchantId })
      );
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

server.listen({ port }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const merchants = [
  {
    id: "1",
    name: "Alice's Restaurant"
  },
  {
    id: "2",
    name: "Bob's Burgers"
  }
];

const locations = [
  {
    id: "1a",
    name: "Uptown",
    merchantId: "1"
  },
  {
    id: "1b",
    name: "Downtown",
    merchantId: "1"
  },
  {
    id: "2a",
    name: "Main Street",
    merchantId: "2"
  },
  {
    id: "2b",
    name: "Online",
    merchantId: "2"
  },
];

const platformAccounts = new Map([
  ["platform1", { id: "platform1", name: "Platform One"}]
]);

const platformToMerchantIds = new Map([
  ["platform1", ["1", "2"]]
]);
