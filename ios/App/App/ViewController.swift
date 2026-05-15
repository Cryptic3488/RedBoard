import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        // Disable native WKWebView scroll bounce — prevents black flash on overscroll
        webView?.scrollView.bounces = false
        webView?.scrollView.showsVerticalScrollIndicator = false
        // Match the app's dark/light background so any gap is invisible
        webView?.isOpaque = false
        webView?.backgroundColor = .clear
        view.backgroundColor = UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 17/255, green: 17/255, blue: 19/255, alpha: 1)  // #111113
                : UIColor(red: 249/255, green: 250/255, blue: 251/255, alpha: 1) // gray-50
        }
    }
}
