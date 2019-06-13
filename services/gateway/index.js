const { ApolloServer } = require("apollo-server");
const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");
const config = require('../../config.json');

const gateway = new ApolloGateway({
  serviceList: config.services.map(service => ({
    name: service.name, url: `http://localhost:${service.port}/graphql`
  })),
  buildService({ url }) {
    return new RemoteGraphQLDataSource({
      url,
      willSendRequest({ request, context }) {
        request.http.headers.set('authorization', context.authorization);
      }
    });
  }
});

async function loadWithRetries(count = 0) {
  if (count > 10) {
    console.log('giving up after 10 tries');
    process.exit();
  }

  try {
    return gateway.load();
  } catch(e) {
    console.log('services not ready...');
  }

  await new Promise(r => setTimeout(100, r));
  return loadWithRetries(count++);
}

(async () => {
  const { executor, schema } = await loadWithRetries();

  const server = new ApolloServer({
    schema,
    executor,
    context: ({ req }) => {
      return { authorization: req.headers.authorization };
    }
  });

  server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
})();
