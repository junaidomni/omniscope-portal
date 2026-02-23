import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function PushNotificationSetup() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const subscribeMutation = trpc.notifications.subscribe.useMutation();
  const unsubscribeMutation = trpc.notifications.unsubscribe.useMutation();
  
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);
  
  const checkSubscription = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking push subscription:", error);
    }
  };
  
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };
  
  const subscribe = async () => {
    setLoading(true);
    
    try {
      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm !== "granted") {
        toast.error("Notification permission denied");
        setLoading(false);
        return;
      }
      
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications
      // Using a public VAPID key (you'll need to generate this)
      const vapidPublicKey = "BEl62iUYgUivxIkv69yViEuiBIa-Ib37gp2CNgWjcFNqlOiYlE2qLocFZYrUYLBbBPXYKdjidg3MwX6XfkFKUYU";
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      
      // Send subscription to backend
      await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
        auth: arrayBufferToBase64(subscription.getKey("auth")!),
      });
      
      setIsSubscribed(true);
      toast.success("Push notifications enabled!");
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      toast.error("Failed to enable push notifications");
    } finally {
      setLoading(false);
    }
  };
  
  const unsubscribe = async () => {
    setLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await unsubscribeMutation.mutateAsync();
        setIsSubscribed(false);
        toast.success("Push notifications disabled");
      }
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      toast.error("Failed to disable push notifications");
    } finally {
      setLoading(false);
    }
  };
  
  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };
  
  if (!("Notification" in window)) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get real-time notifications for messages, calls, and mentions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {permission === "denied" ? (
          <p className="text-sm text-muted-foreground">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        ) : (
          <Button
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={loading}
            variant={isSubscribed ? "outline" : "default"}
            className="w-full"
          >
            {loading ? "Processing..." : isSubscribed ? "Disable Notifications" : "Enable Notifications"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
