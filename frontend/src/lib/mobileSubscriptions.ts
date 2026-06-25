import { Capacitor } from "@capacitor/core";
import { Purchases, type PurchasesPackage } from "@revenuecat/purchases-capacitor";

type StorePlan = "MONTHLY" | "YEARLY";

let configuredForUserId: string | null = null;

function getRevenueCatKey() {
  const platform = Capacitor.getPlatform();
  if (platform === "android") return import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY || "";
  if (platform === "ios") return import.meta.env.VITE_REVENUECAT_IOS_API_KEY || "";
  return "";
}

function isMobileStoreAvailable() {
  return Capacitor.isNativePlatform() && !!getRevenueCatKey();
}

export async function configureRevenueCat(userId: string) {
  if (!isMobileStoreAvailable()) return false;
  if (configuredForUserId === userId) return true;

  await Purchases.configure({
    apiKey: getRevenueCatKey(),
    appUserID: userId,
  });
  configuredForUserId = userId;
  return true;
}

function packageMatchesPlan(pkg: PurchasesPackage, plan: StorePlan) {
  const raw = `${pkg.identifier} ${pkg.packageType} ${pkg.product.identifier}`.toLowerCase();
  if (plan === "MONTHLY") return raw.includes("month") || raw.includes("monthly");
  return raw.includes("annual") || raw.includes("year") || raw.includes("yearly");
}

export async function purchaseMobileSubscription(userId: string, plan: StorePlan) {
  const configured = await configureRevenueCat(userId);
  if (!configured) return { usedStore: false };

  const offerings = await Purchases.getOfferings();
  const availablePackages = offerings.current?.availablePackages || [];
  const selectedPackage = availablePackages.find((pkg) => packageMatchesPlan(pkg, plan));

  if (!selectedPackage) {
    throw new Error("No matching subscription package found. Configure monthly/yearly products in RevenueCat.");
  }

  await Purchases.purchasePackage({ aPackage: selectedPackage });
  return { usedStore: true };
}
