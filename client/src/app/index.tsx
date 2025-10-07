import { AppProvider } from "./provider";
import { RouterProvider } from "react-router";
import { router } from "./router";

function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}

export default App;
