import { Link } from "react-router";
import beaver from "@/assets/beaver.svg";
import { Button } from "./ui/button";

function Home() {
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
      <h1 className="text-5xl font-black">BenSTACK</h1>
      {/* <h2 className="text-2xl font-bold">Bun + Hono + Vite + React</h2>
      <p>A typesafe fullstack monorepo</p> */}
      <Link to="/login">
        <Button size="lg">Get Started</Button>
      </Link>
    </div>
  );
}

export default Home;
