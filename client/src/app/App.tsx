import { BrowserRouter, Routes, Route } from "react-router";
import Home from "../components/Home";
import { AppProvider } from './provider';

function App() {
	return (
<AppProvider>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
			</Routes>
		</BrowserRouter>
</AppProvider>
	);
}

export default App;
