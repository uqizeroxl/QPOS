import ErrorBoundary from "./components/ErrorBoundary";
import AppProviders from "./contexts/AppProviders";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
