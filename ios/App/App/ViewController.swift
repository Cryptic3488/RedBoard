import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        // Disable native WKWebView scroll bounce — prevents black flash on overscroll
        webView?.scrollView.bounces = false
        webView?.scrollView.showsVerticalScrollIndicator = false
    }
}
