const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const pkg = require('./package.json');
const config = require('../../config.json');

const { port } = config.services.find(s => s.name === pkg.name);

const typeDefs = gql`
  input PaymentFilter {
    minCents: Int
    maxCents: Int
  }

  extend type Merchant @key(fields: "id") {
    id: ID! @external
    payments(filter: PaymentFilter): [Payment!]!
  }

  extend interface Payment {
    _id: ID!
  }

  extend type CardPayment implements Payment @key(fields: "id locationId") {
    id: ID! @external
    locationId: ID! @external
    _id: ID!
  }

  extend type CashPayment implements Payment @key(fields: "id locationId") {
    id: ID! @external
    locationId: ID! @external
    _id: ID!
  }
`;

const resolvers = {
  Merchant: {
    payments(merchant, { filter }) {
      return filterPayments({ ...filter, merchantId: merchant.id });
    }
  },
  Payment: {
    __resolveType({ type }) {
      return type;
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

function filterPayments({ merchantId, minCents, maxCents }) {
  const filters = [
    merchantId && (p => p.merchantId === merchantId),
    minCents && (p => p.amountCents >= minCents),
    maxCents && (p => p.amountCents <= maxCents)
  ].filter(Boolean);

  return payments.filter(p => filters.reduce((found, fn) => fn(p) && found, true));
}

// Not ideal that the indexing service needs to know about types, but we can't
// return __typename: "Payment" because it's an interface (typenames must be
// concrete types).
const payments = [
  {
    id: "p1",
    locationId: "1a",
    merchantId: "1",
    type: "CardPayment",
    amountCents: 123
  },
  {
    id: "p2",
    locationId: "1a",
    merchantId: "1",
    type: "CashPayment",
    amountCents: 599
  },
  {
    id: "p3",
    locationId: "2a",
    merchantId: "2",
    type: "CardPayment",
    amountCents: 234
  },
  {
    id: "p4",
    locationId: "2a",
    merchantId: "2",
    type: "CardPayment",
    amountCents: 345
  }
];
