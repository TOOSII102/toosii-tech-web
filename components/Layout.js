import Header from './Header/Header'
import Footer from './Footer'
import './layout.css'

export default function Layout({ children }) {
  return (
    <div className="site-layout">
      <Header />
      <main className="site-main">{children}</main>
      <Footer />
    </div>
  )
}
