"use client";

import { useEffect } from "react";
import { getAnalyticsSafe } from "~/lib/firebase";

export function FirebaseAnalytics() {
  useEffect(() => {
    getAnalyticsSafe();
  }, []);
  return null;
}
