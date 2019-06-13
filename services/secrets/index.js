const { ApolloServer, gql, ApolloError } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const pkg = require('./package.json');
const config = require('../../config.json');

const { port } = config.services.find(s => s.name === pkg.name);

const typeDefs = gql`
  extend type PaymentCard @key(fields: "panFideliusToken") {
    panFideliusToken: ID! @external
    decryptedPan: String
  }
`;

const resolvers = {
  PaymentCard: {
    decryptedPan(paymentCard, _, { authorized }) {
      if (!authorized) {
        throw new ApolloError('unauthorized access to decryptedPan');
      }
      return decryptPans(paymentCard.panFideliusToken)
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

function decryptPans(fideliusToken) {
  return fideliusToken.split('').reverse().join('');
}
