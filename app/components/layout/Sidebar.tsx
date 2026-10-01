import NavLinks from "./NavLinks";

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-gray-200 shadow-md z-30">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-gray-300">
        <span className="text-2xl">🎟️</span>
        <span className="font-bold text-lg text-red-800">
          StudentManagement
        </span>
      </div>
      <NavLinks />
    </aside>
  );
}
