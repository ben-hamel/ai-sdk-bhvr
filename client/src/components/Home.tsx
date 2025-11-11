import { useState } from "react";
import { useNavigate } from "react-router";
import beaver from "@/assets/beaver.svg";
import type { ApiResponse } from "shared";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { SERVER_URL } from "@/constants";


function Home() {
	const [data, setData] = useState<ApiResponse | undefined>();
	const navigate = useNavigate();

	const { mutate: sendRequest } = useMutation({
		mutationFn: async () => {
			try {
				const req = await fetch(`${SERVER_URL}/api/v1/hello`);
				const res: ApiResponse = await req.json();
				setData(res);
			} catch (error) {
				console.log(error);
			}
		},
	});

	const { mutate: createChat, isPending: isCreatingChat } = useMutation({
		mutationFn: async () => {
			const res = await fetch(`${SERVER_URL}/api/v1/chats`, { method: "POST" });
			if (!res.ok) {
				throw new Error("Failed to create chat");
			}
			return res.json() as Promise<{ id: string }>;
		},
		onSuccess: (data) => {
			navigate(`/chat/${data.id}`);
		},
	});

	return (
		<div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen">
			<a
				href="https://github.com/stevedylandev/bhvr"
				target="_blank"
				rel="noopener"
			>
				<img
					src={beaver}
					className="w-16 h-16 cursor-pointer"
					alt="beaver logo"
				/>
			</a>
			<h1 className="text-5xl font-black">bhvr</h1>
			<h2 className="text-2xl font-bold">Bun + Hono + Vite + React</h2>
			<p>A typesafe fullstack monorepo</p>
			<div className="flex items-center gap-4">
				<Button onClick={() => createChat()} disabled={isCreatingChat}>
					{isCreatingChat ? "Creating..." : "New Chat"}
				</Button>
				<Button onClick={() => sendRequest()}>Call API</Button>
				<Button variant="secondary" asChild>
					<a target="_blank" href="https://bhvr.dev" rel="noopener">
						Docs
					</a>
				</Button>
			</div>
			<div className="flex items-center gap-4">
				<Button variant="outline" asChild>
					<a href="/users">View Users</a>
				</Button>
			</div>
			{data && (
				<pre className="bg-accent p-4 rounded-md">
					<code>
						Message: {data.message} <br />
						Success: {data.success.toString()}
					</code>
				</pre>
			)}
		</div>
	);
}

export default Home;
