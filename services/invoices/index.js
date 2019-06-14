const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const pkg = require('./package.json');
const config = require('../../config.json');

const { port } = config.services.find(s => s.name === pkg.name);

const typeDefs = gql`
  enum InvoiceStatus {
    PENDING
    PAID
    OVERDUE
  }

  type Invoice @key(fields: "id") {
    id: ID!
    name: String!
    sentAt: String!
    status: InvoiceStatus!
  }

  type InvoiceSettings {
    defaultFromAddress: String!
  }

  extend type Merchant @key(fields: "id") {
    id: ID! @external
    invoiceSettings: InvoiceSettings
  }

  extend type Payment @key(fields: "id locationId") {
    id: ID! @external
    locationId: ID! @external
    invoice: Invoice
  }
`;

const resolvers = {
  Payment: {
    invoice(payment) {
      return invoices.find(i => i.paymentId === payment.id);
    }
  },
  Merchant: {
    invoiceSettings(merchant) {
      return settingsStorage.get(merchant.id);
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

const invoices = [
  {
    id: 'invoice-1',
    paymentId: 'p1',
    name: 'Invoice 1',
    sentAt: new Date().toString(),
    status: 'PAID'
  }
];

const settingsStorage = new Map([
  ["1", { defaultFromAddress: 'pay-me@alicesrestaurant.com'} ],
  ["2", { defaultFromAddress: 'orders@bobsburgers.com'} ],
])
