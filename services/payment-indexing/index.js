const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const pkg = require('./package.json');
const config = require('../../config.json');

const { port } = config.services.find(s => s.name === pkg.name);

const typeDefs = gql`
  input PaymentFilter {
    minCents: Int
    maxCents: Int
    status: String # CardPaymentStatus
  }

  extend type Merchant @key(fields: "id") {
    id: ID! @external
    payments(filter: PaymentFilter): [Payment!]! # @provides(fields: "status total")
  }

  extend type Payment @key(fields: "id") {
    id: ID! @external
    merchant: Merchant
    # status: CardPaymentStatus
    # total: Money
  }
`;

const resolvers = {
  Merchant: {
    payments(merchant, { filter }) {
      return filterPayments({ ...filter, merchantId: merchant.id });
    }
  },
  Payment: {
    __resolveReference(object) {
      return payments.find(p => p.id === object.id);
    },
    merchant(payment) {
      return { __typename: 'Merchant', id: payment.merchantId }
    },
    total(payment) {
      return { __typename: 'Money', amount: payment.amountCents, currencyCode: 'USD' };
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

function filterPayments({ merchantId, minCents, maxCents, status }) {
  const filters = [
    merchantId && (p => p.merchantId === merchantId),
    minCents && (p => p.amountCents >= minCents),
    maxCents && (p => p.amountCents <= maxCents),
    status && (p => p.status === status)
  ].filter(Boolean);

  return payments.filter(p => filters.reduce((found, fn) => fn(p) && found, true));
}

const payments = [
  {
    id: "p1",
    merchantId: "1",
    amountCents: 123,
    status: 'CAPTURED'
  },
  {
    id: "p2",
    merchantId: "1",
    amountCents: 599,
    status: 'PENDING'
  },
  {
    id: "p3",
    merchantId: "2",
    amountCents: 234,
    status: 'CAPTURED'
  },
  {
    id: "p4",
    merchantId: "2",
    amountCents: 345,
    status: 'PENDING'
  }
];
