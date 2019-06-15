const { ApolloServer, gql, ApolloError } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const pkg = require('./package.json');
const config = require('../../config.json');

const { port } = config.services.find(s => s.name === pkg.name);

const typeDefs = gql`
  enum CapitalLoanStatus {
    PENDING
    APPROVED
    PAID
  }

  type CapitalLoan @key(fields: "id") {
    id: ID!
    appliedAt: String!
    status: CapitalLoanStatus!
  }

  extend type Merchant @key(fields: "id") {
    id: ID! @external
    capitalLoans: [CapitalLoan!]
    hasActiveCapitalLoan: Boolean
  }
`;

const resolvers = {
  Merchant: {
    capitalLoans(merchant) {
      return LOANS.filter(loan => loan.merchantId === merchant.id);
    },
    hasActiveCapitalLoan(merchant) {
      const loans = LOANS.filter(loan => loan.merchantId === merchant.id);
      return loans.some(loan => loan.status === 'APPROVED');
    }
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers
    }
  ]),
  context({ req }) {
    return { authorized: req.headers.authorization === 'supersecret' };
  }
});

server.listen({ port }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const LOANS = [{
  id: 'loan-1',
  merchantId: '1',
  status: 'APPROVED'
}];
