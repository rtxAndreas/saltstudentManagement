export default function Footer() {
  return (
    <footer className="lg:ml-64 border-t border-slate-200 bg-white/85 text-slate-600 text-center py-4 text-sm">
      <p>
        &copy; {new Date().getFullYear()} Salt Student Management. Tous droits
        réservés.
      </p>
    </footer>
  );
}
