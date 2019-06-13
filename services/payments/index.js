const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const pkg = require('./package.json');
const config = require('../../config.json');

const { port } = config.services.find(s => s.name === pkg.name);

const typeDefs = gql`
  extend type Query {
    payment(id: ID!, locationId: ID!): Payment
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

  interface Payment {
    id: ID!
    locationId: ID!
    createdAt: String!
    total: Money!
  }

  enum CardPaymentStatus {
    PENDING
    SUCCESS
    DECLINED
  }

  type CardPayment implements Payment @key(fields: "id locationId") {
    id: ID!
    locationId: ID!
    createdAt: String!
    total: Money!
    status: CardPaymentStatus!
    card: PaymentCard @provides(fields: "id maskedPan panFideliusToken")
  }

  type CashPayment implements Payment @key(fields: "id locationId") {
    id: ID!
    locationId: ID!
    createdAt: String!
    total: Money!
    change: Money!
  }

  extend type Location @key(fields: "id") {
    id: ID! @external
    payments(limit: Int, cursor: String): PaymentConnection!
  }

  type PaymentConnection {
    nodes: [Payment!]!
    cursor: String
  }
`;

const resolvers = {
  Query: {
    payment(_, { id, locationId }) {
      return payments.find(p => p.id === id);
    }
  },
  // TODO: should we need these reference resolvers? It'd be nicer if it
  // went to the Payment resolver, but the payment-indexing service needs
  // to return a concrete object type for __typename so we'll enter the
  // graph here.
  CardPayment: {
    __resolveReference(object) {
      return payments.find(p => p.id === object.id);
    }
  },
  CashPayment: {
    __resolveReference(object) {
      return payments.find(p => p.id === object.id);
    }
  },
  Payment: {
    __resolveType({ type }) {
      return type;
    },
    __resolveReference(object) {
      return payments.find(p => p.id === object.id);
    }
  },
  Location: {
    payments(location, { limit, cursor }) {
      return {
        nodes: payments.filter(p => p.locationId === location.id)
      };
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
    type: "CardPayment",
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
    type: "CashPayment",
    total: {
      amount: 499,
      currencyCode: "USD"
    },
    change: {
      amount: 1,
      currencyCode: "USD"
    }
  },
  {
    id: "p3",
    locationId: "2a",
    createdAt: new Date().toString(),
    type: "CardPayment",
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
    type: "CardPayment",
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
