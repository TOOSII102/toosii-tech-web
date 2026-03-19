import Link from 'next/link'
import './footer.css'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="footer-icon">T</div>
            <span>Toosii Tech</span>
          </div>
          <p className="footer-tagline">Self-taught developer building tools that actually work.</p>
          <div className="footer-socials">
            <a href="https://github.com/TOOSII102" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="mailto:toosiitechcompany@gmail.com">Email</a>
            <a href="https://wa.me/254748340864" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Navigation</h4>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About Me</Link></li>
            <li><Link href="/bot">XD Ultra Bot</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Tools</h4>
          <ul>
            <li><Link href="/session">Session Generator</Link></li>
            <li><Link href="/downloader/video">Video Downloader</Link></li>
            <li><Link href="/downloader/audio">MP3 Downloader</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Contact</h4>
          <a href="mailto:toosiitechcompany@gmail.com">toosiitechcompany@gmail.com</a>
          <a href="https://wa.me/254748340864" target="_blank" rel="noopener noreferrer">+254 748 340 864</a>
          <a href="https://wa.me/254746677793" target="_blank" rel="noopener noreferrer">+254 746 677 793</a>
          <a href="https://wa.me/254788781373" target="_blank" rel="noopener noreferrer">+254 788 781 373</a>
          <a href="https://t.me/toosiitech" target="_blank" rel="noopener noreferrer">@toosiitech (Telegram)</a>
          <span>Nairobi, Kenya</span>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} Toosii Tech. All rights reserved.</p>
        <Link href="/privacy-policy">Privacy Policy</Link>
      </div>
    </footer>
  )
}
