const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const pkg = require('./package.json');
const config = require('../../config.json');

const { port } = config.services.find(s => s.name === pkg.name);

const typeDefs = gql`
  extend type Query {
    payment(id: ID!): Payment
  }

  type Money {
    amount: Int!
    currencyCode: String!
  }

  # should extend from instruments type
  type PaymentCard @key(fields: "id") @key(fields: "panFideliusToken") {
    id: ID!
    maskedPan: String!
    panFideliusToken: ID!
  }

  enum CardPaymentStatus {
    PENDING
    SUCCESS
    DECLINED
  }

  type Payment @key(fields: "id") {
    id: ID!
    location: Location!
    createdAt: String!
    total: Money!
    status: CardPaymentStatus!
    card: PaymentCard @provides(fields: "id maskedPan panFideliusToken")
  }

  extend type Location @key(fields: "id") {
    id: ID! @external
    payments: [Payment!]!
  }
`;

const resolvers = {
  Query: {
    payment(_, { id }) {
      return payments.find(p => p.id === id);
    }
  },
  Payment: {
    __resolveReference(object) {
      return payments.find(p => p.id === object.id);
    },
    location(payment) {
      return { id: payment.locationId };
    }
  },
  Location: {
    payments(location, { limit, cursor }) {
      return payments.filter(p => p.locationId === location.id);
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

const payments = [
  {
    id: "p1",
    locationId: "1a",
    createdAt: new Date().toString(),
    total: {
      amount: 123,
      currencyCode: "USD"
    },
    status: "SUCCESS",
    card: {
      id: "c1",
      maskedPan: "4•••1234",
      panFideliusToken: "pan-fid-1"
    }
  },
  {
    id: "p2",
    locationId: "1a",
    createdAt: new Date().toString(),
    total: {
      amount: 499,
      currencyCode: "USD"
    },
    status: "SUCCESS",
    card: {
      id: "c1",
      maskedPan: "4•••1234",
      panFideliusToken: "pan-fid-1"
    }
  },
  {
    id: "p3",
    locationId: "2a",
    createdAt: new Date().toString(),
    total: {
      amount: 234,
      currencyCode: "USD"
    },
    status: "SUCCESS",
    card: {
      id: "c1",
      maskedPan: "4•••1234",
      panFideliusToken: "pan-fid-1"
    }
  },
  {
    id: "p4",
    locationId: "2a",
    createdAt: new Date().toString(),
    total: {
      amount: 234,
      currencyCode: "USD"
    },
    status: "SUCCESS",
    card: {
      id: "c1",
      maskedPan: "4•••1234",
      panFideliusToken: "pan-fid-1"
    }
  },
];
