const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');


const schema = buildSchema(`
  type Query {
    user(id: ID!): User
    users: [User]
    post(id: ID!): Post
    posts: [Post]
  }

  type Mutation {
    addPost(title: String!, content: String!, authorId: ID!): Post
    likePost(postId: ID!, userId: ID!): Post
    addComment(postId: ID!, userId: ID!, content: String!): Comment
    followUser(followerId: ID!, followingId: ID!): User
  }

  type User {
    id: ID!
    name: String
    email: String
    posts: [Post]
    followers: [User]
    following: [User]
  }

  type Post {
    id: ID!
    title: String
    content: String
    author: User
    likes: [User]
    comments: [Comment]
  }

  type Comment {
    id: ID!
    content: String
    author: User
  }
`);


const users = [
  {
    id: "0",
    name: 'Alice',
    email: 'alice@example.com',
    followers: ["1"],
    following: ["1"],
  },
  {
    id: "1",
    name: 'Bob',
    email: 'bob@example.com',
    followers: ["0"],
    following: ["0"],
  },
];

const posts = [
  {
    id: "0",
    title: "Alice's First Post",
    content: "Hello World!",
    author: "0",
    likes: ["1"],
    comments: [
      {
        id: "0",
        content: "Great post, Alice!",
        authorId: "1",
      },
    ],
  },
];

const comments = [
  {
    id: "0",
    postId: "0",
    content: "Great post, Alice!",
    authorId: "1",
  },
];


const root = {
  user: ({ id }) => {
    const user = users.find(user => user.id === id);
    if (user) {
      user.posts = posts
          .filter(post => post.author === user.id)
          .map(post => ({
            ...post,
            likes: post.likes.map(likeId => users.find(user => user.id === likeId)),
            comments: post.comments.map(comment => ({
              ...comment,
              author: users.find(user => user.id === comment.authorId),
            })),
          }));
      user.followers = user.followers.map(followerId => users.find(user => user.id === followerId));
      user.following = user.following.map(followingId => users.find(user => user.id === followingId));
    }
    return user;
  },

  users: () => {
    return users.map(user => ({
      ...user,
      posts: posts.filter(post => post.author === user.id),
      followers: user.followers.map(followerId => users.find(user => user.id === followerId)),
      following: user.following.map(followingId => users.find(user => user.id === followingId)),
    }));
  },

  post: ({ id }) => {
    const post = posts.find(post => post.id === id);
    if (post) {
      post.author = users.find(user => user.id === post.author);
      post.likes = post.likes.map(likeId => users.find(user => user.id === likeId));
      post.comments = post.comments.map(comment => ({
        ...comment,
        author: users.find(user => user.id === comment.authorId),
      }));
    }
    return post;
  },

  posts: () => {
    return posts.map(post => ({
      ...post,
      author: users.find(user => user.id === post.author),
      likes: post.likes.map(likeId => users.find(user => user.id === likeId)),
      comments: post.comments.map(comment => ({
        ...comment,
        author: users.find(user => user.id === comment.authorId),
      })),
    }));
  },

  addPost: ({ title, content, authorId }) => {
    const newPost = { id: String(posts.length), title, content, author: authorId, likes: [], comments: [] };
    posts.push(newPost);
    return newPost;
  },

  likePost: ({ postId, userId }) => {
    const post = posts.find(post => post.id === postId);
    if (post && !post.likes.includes(userId)) {
      post.likes.push(userId);
    }
    return post;
  },

  addComment: ({ postId, userId, content }) => {
    const newComment = { id: String(comments.length), postId, authorId: userId, content };
    comments.push(newComment);
    return {
      ...newComment,
      author: users.find(user => user.id === userId),
    };
  },

  followUser: ({ followerId, followingId }) => {
    const follower = users.find(user => user.id === followerId);
    const following = users.find(user => user.id === followingId);

    if (follower && following) {
      if (!follower.following.includes(followingId)) {
        follower.following.push(followingId);
      }
      if (!following.followers.includes(followerId)) {
        following.followers.push(followerId);
      }
    }
    return follower;
  },
};


const app = express();
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));


app.listen(4000, () => console.log('Serveur GraphQL lancé sur http://localhost:4000/graphql'));
