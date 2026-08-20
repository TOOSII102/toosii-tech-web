import Header from './Header/Header'
import Footer from './Footer'
import './layout.css'

export default function Layout({ children }) {
  return (
    <div className="site-layout">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header />
      <main id="main-content" className="site-main">{children}</main>
      <Footer />
    </div>
  )
}
