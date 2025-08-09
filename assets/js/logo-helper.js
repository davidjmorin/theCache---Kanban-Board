/**
 * Logo Helper - Shared functionality for loading user custom logos
 */
class LogoHelper {
    constructor() {
        this.logoUrl = '/assets/thecache_logo.png'; // Default
        this.loaded = false;
    }

    async loadUserLogo() {
        if (this.loaded) {
            return this.logoUrl;
        }

        try {
            const response = await fetch('/api.php?endpoint=user-logo');
            if (response.ok) {
                const data = await response.json();
                if (data.has_logo && data.logo_url) {
                    this.logoUrl = data.logo_url;
                }
            }
        } catch (error) {
            console.warn('Could not load user logo:', error);
            // Fall back to default logo
        }
        
        this.loaded = true;
        return this.logoUrl;
    }

    async updatePageLogos() {
        const logoUrl = await this.loadUserLogo();
        
        // Update all logo images on the page
        const logoImages = document.querySelectorAll('.header-logo, .logo-image, .company-logo');
        logoImages.forEach(img => {
            img.src = logoUrl;
        });

        // Update favicon if custom logo is available
        if (logoUrl !== '/assets/thecache_logo.png') {
            this.updateFavicon(logoUrl);
        }
    }

    updateFavicon(logoUrl) {
        try {
            // Create new link element for favicon
            const link = document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = logoUrl;
            
            // Remove existing favicon
            const existingLink = document.querySelector('link[rel="shortcut icon"]');
            if (existingLink) {
                existingLink.remove();
            }
            
            // Add new favicon
            document.head.appendChild(link);
        } catch (error) {
            console.warn('Could not update favicon:', error);
        }
    }

    // Method to manually refresh logos (useful after upload)
    async refreshLogos() {
        this.loaded = false;
        await this.updatePageLogos();
    }
}

// Global instance
window.logoHelper = new LogoHelper();

// Auto-load logos when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only load if we're authenticated (avoid unnecessary API calls on login page)
    const appContainer = document.getElementById('appContainer');
    const loginContainer = document.getElementById('loginContainer');
    
    // Load logos if app container exists and is visible, or if login container is hidden
    const shouldLoadLogos = (appContainer && appContainer.style.display !== 'none') || 
                           (loginContainer && loginContainer.style.display === 'none') ||
                           (!loginContainer); // No login container means we're authenticated
    
    if (shouldLoadLogos) {
        window.logoHelper.updatePageLogos();
    }
});
