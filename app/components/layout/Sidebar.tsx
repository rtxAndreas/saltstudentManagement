import NavLinks from "./NavLinks";

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 border-r border-slate-200 bg-white/85 backdrop-blur-sm shadow-sm z-30">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-200">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-sm">
          S
        </span>
        <span className="font-bold text-lg text-slate-800">
          StudentManagement
        </span>
      </div>
      <NavLinks />
    </aside>
  );
}
