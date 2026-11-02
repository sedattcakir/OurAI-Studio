import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { path: "/", label: "Dashboard", icon: "grid" },
  { path: "/text", label: "Text Generation", icon: "text" },
];

function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-primary-400">CakAI Studio</h1>
          <p className="text-xs text-gray-400 mt-1">AI Content Platform</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === item.path
                  ? "bg-primary-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-sm text-gray-300 truncate">{user?.fullName}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {navItems.find((i) => i.path === location.pathname)?.label ?? "CakAI Studio"}
          </h2>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
