const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");

const typeDefs = gql`
  type Review @key(fields: "id") {
    id: ID!
    body: String
    author: User @provides(fields: "username")
    product: Product
  }

  extend type User @key(fields: "id") {
    id: ID! @external
    username: String @external
    reviews: [Review!]
  }

  # would prefer to declare the key here, but currently causes an error:
  # Field "Product.id" already exists in the schema. It cannot also be defined in this type extension.
  #
  # extend interface Product @key(fields: "id") {
  #   id: ID! @external
  #   reviews: [Review!]
  # }

  extend interface Product {
    reviews: [Review!]
  }

  extend type Book implements Product @key(fields: "id") {
    id: ID! @external
    reviews: [Review!]
  }

  extend type Furniture implements Product @key(fields: "id") {
    id: ID! @external
    reviews: [Review!]
  }
`;

const resolvers = {
  Review: {
    author(review) {
      return { __typename: "User", id: review.authorID };
    }
  },
  User: {
    reviews(user) {
      return reviews.filter(review => review.authorID === user.id);
    },
    numberOfReviews(user) {
      return reviews.filter(review => review.authorID === user.id).length;
    },
    username(user) {
      const found = usernames.find(username => username.id === user.id);
      return found ? found.username : null;
    }
  },
  Product: {
    // ***********************
    // This is very difficult!
    // ***********************
    __resolveType(object) {
      return object.id < 4 ? 'Furniture' : 'Book'
    }
  },
  Book: {
    reviews(product) {
      return reviews.filter(review =>
        review.product.id === product.id
      );
    }
  },
  Furniture: {
    reviews(product) {
      return reviews.filter(review =>
        review.product.id === product.id
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

server.listen({ port: 4002 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const usernames = [
  { id: "1", username: "@ada" },
  { id: "2", username: "@complete" }
];
const reviews = [
  {
    id: "1",
    authorID: "1",
    product: { id: "1" },
    body: "Love it!"
  },
  {
    id: "2",
    authorID: "1",
    product: { id: "2" },
    body: "Too expensive."
  },
  {
    id: "3",
    authorID: "2",
    product: { id: "3" },
    body: "Could be better."
  },
  {
    id: "4",
    authorID: "2",
    product: { id: "1" },
    body: "Prefer something else."
  },
  {
    id: "5",
    authorID: "1",
    product: { id: "4" },
    body: "Too real."
  },
  {
    id: "6",
    authorID: "2",
    product: { id: "5" },
    body: "Talking animals?"
  }
];
