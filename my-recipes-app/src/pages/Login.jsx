export default function Login() {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl mb-4">Login</h2>
        <input className="border p-2 mb-2" type="text" placeholder="Username" />
        <input className="border p-2 mb-2" type="password" placeholder="Password" />
        <button className="bg-blue-500 text-white p-2 rounded">Login</button>
      </div>
    );
  }
  