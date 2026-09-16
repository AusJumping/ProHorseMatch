import Foundation
import Capacitor

// Bridges Firebase's FCM token (captured in AppDelegate's MessagingDelegate)
// through to JavaScript, mirroring the token Android already gets directly
// from Capacitor's standard PushNotifications 'registration' event.
@objc(FCMTokenPlugin)
public class FCMTokenPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FCMTokenPlugin"
    public let jsName = "FCMTokenPlugin"
    public let pluginMethods: [CAPPluginMethod] = []

    public override func load() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(onTokenRefresh(_:)),
            name: Notification.Name("FCMTokenRefresh"),
            object: nil
        )
    }

    @objc func onTokenRefresh(_ notification: Notification) {
        if let token = notification.object as? String {
            notifyListeners("fcmToken", data: ["value": token])
        }
    }
}
