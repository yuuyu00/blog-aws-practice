import "dotenv/config";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import cors from "cors";
import http from "http";
import fs from "fs";
import path from "path";
import { resolvers } from "./resolvers";
import { createContainer } from "./infrastructure/container";
import { verifyJWT } from "./auth";
import { PrismaClient } from "@prisma/client";
import type { GraphQLContext } from "./types";
import type { AuthUser } from "./auth";

// Load environment variables from .env.local if it exists
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Load GraphQL schema from file
const typeDefs = fs.readFileSync(
  path.join(__dirname, "../schema/schema.gql"),
  "utf8"
);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const prisma = new PrismaClient();

  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
  });

  await server.start();

  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.use(cors({
    origin: process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
      ['http://localhost:3000', 'https://blog-aws-practice-frontend.mrcdsamg63.workers.dev'],
    credentials: true,
  }));
  app.use(express.json());
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const authorizationHeader = req.headers.authorization || "";
        const token = authorizationHeader.startsWith("Bearer ")
          ? authorizationHeader.slice(7)
          : null;

        let user: AuthUser | null = null;

        if (token) {
          try {
            const authEnv = {
              SUPABASE_URL: process.env.SUPABASE_URL || "",
              SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
              SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || "",
            };
            user = await verifyJWT(`Bearer ${token}`, authEnv);
          } catch (error) {
            console.error("JWT verification failed:", error);
          }
        }

        const container = createContainer(prisma);

        const env: any = {
          SUPABASE_URL: process.env.SUPABASE_URL || "",
          SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
          SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || "",
          GRAPHQL_INTROSPECTION: process.env.GRAPHQL_INTROSPECTION,
          GRAPHQL_PLAYGROUND: process.env.GRAPHQL_PLAYGROUND,
          CORS_ORIGIN: process.env.CORS_ORIGIN,
        };

        return {
          prisma,
          user,
          env,
          container,
        };
      },
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );

  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
  console.log(`🎮 Apollo Sandbox: http://localhost:${PORT}/graphql`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

  const signals = ['SIGTERM', 'SIGINT'];
  signals.forEach(signal => {
    process.on(signal, async () => {
      console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
      await server.stop();
      httpServer.close(() => {
        console.log('💤 Server closed');
        prisma.$disconnect();
        process.exit(0);
      });
    });
  });
}

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
