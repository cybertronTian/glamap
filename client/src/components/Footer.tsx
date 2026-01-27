import { Link } from "wouter";
import { SiLinkedin, SiInstagram } from "react-icons/si";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-display text-xl font-bold mb-1">Glamap</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Connecting you with the best freelance beauty professionals in your area.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Project designed by Yijia Sang</h4>
            <div className="flex gap-4 mb-3">
              <a 
                href="https://www.linkedin.com/in/yijia-sang" 
                target="_blank" 
                rel="noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-social-linkedin"
              >
                <SiLinkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/glamap_co" 
                target="_blank" 
                rel="noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-social-instagram"
              >
                <SiInstagram className="w-5 h-5" />
              </a>
              <a 
                href="mailto:glamap.dev@gmail.com" 
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-about" onClick={() => window.scrollTo(0, 0)}>
              About Glamap
            </Link>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-privacy" onClick={() => window.scrollTo(0, 0)}>
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-terms" onClick={() => window.scrollTo(0, 0)}>
                Terms of Use
              </Link>
            </nav>
          </div>
        </div>
        
        <div className="border-t pt-8">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Glamap. All rights reserved. 
            <br />
            <span className="mt-2 inline-block italic">
              Disclaimer: Glamap is a directory service. We are not liable for any services rendered by independent providers found on this platform.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
