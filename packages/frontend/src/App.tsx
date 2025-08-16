import { createBrowserRouter, RouterProvider, Link, Outlet, useNavigate } from "react-router";
import { ApolloProvider, ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { ArticleDetail, ArticleList, Login, Signup, CreateArticle, SignUpProfile } from "./screens";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthGuard } from "./components/AuthGuard";
import { EmailConfirmationHandler } from "./components/EmailConfirmationHandler";
import { ProfileCheckWrapper } from "./components/ProfileCheckWrapper";
import { Button } from "./components/ui/button";
import { useAuth } from "./contexts/AuthContext";
import { PlusIcon } from "@heroicons/react/24/solid";
import { supabase } from "./lib/supabase";

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="absolute top-0 right-0 p-6">
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <Button onClick={signOut} plain className="text-text hover:text-white">
            ログアウト
          </Button>
        </div>
      ) : (
        <Link to="/login">
          <Button color="blue">
            ログイン
          </Button>
        </Link>
      )}
    </div>
  );
};

const FAB = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <button
      onClick={() => navigate("/articles/new")}
      className="fixed z-50 bottom-8 right-8 bg-primary hover:bg-primary/90 text-white w-14 h-14 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110 flex items-center justify-center group"
      aria-label="新規投稿を作成"
    >
      <PlusIcon className="w-6 h-6" />
      <span className="absolute right-full mr-3 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        新規投稿を作成
      </span>
    </button>
  );
};

const RootLayout = () => {
  return (
    <ProfileCheckWrapper>
      <Header />
      <Outlet />
      <FAB />
    </ProfileCheckWrapper>
  );
};

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // Create HTTP link
  const httpLink = createHttpLink({
    uri: import.meta.env.VITE_GRAPHQL_ENDPOINT,
  });

  // Create auth link to add JWT token to requests
  const authLink = setContext(async (_, { headers }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      }
    }
  });

  // Apollo Client with auth context
  const apolloClient = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });

  return (
    <div className="bg-background min-h-screen text-text relative">
      <ApolloProvider client={apolloClient}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </ApolloProvider>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppProvider><RootLayout /></AppProvider>,
    children: [
      {
        index: true,
        element: <ArticleList />,
      },
      {
        path: "articles/:id",
        element: <ArticleDetail />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup",
        element: <Signup />,
      },
      {
        path: "signup-profile",
        element: <SignUpProfile />,
      },
      {
        path: "auth/callback",
        element: <EmailConfirmationHandler />,
      },
      // Protected routes
      {
        element: <AuthGuard />,
        children: [
          {
            path: "articles/new",
            element: <CreateArticle />,
          },
        ],
      },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
