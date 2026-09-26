import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          R2<span className="dot">Flash</span>
        </div>
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Sites
        </NavLink>
        <NavLink to="/sites/new" className={({ isActive }) => (isActive ? 'active' : '')}>
          + Novo site
        </NavLink>
        <button className="logout" onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
