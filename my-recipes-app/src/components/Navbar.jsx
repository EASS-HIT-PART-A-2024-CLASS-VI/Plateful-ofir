import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-500 p-4 text-white flex justify-between">
      <h1 className="text-xl font-bold">Plateful</h1>
      <div>
        <Link to="/" className="mx-2">Home</Link>
        <Link to="/recipes" className="mx-2">Recipes</Link>
        <Link to="/login" className="mx-2">Login</Link>
      </div>
    </nav>
  );
}
