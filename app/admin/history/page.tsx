"use client"

import dynamic from "next/dynamic"

const HistoryMapClient = dynamic(() => import("@/components/admin/history-map-client"), {
  ssr: false,
})

export default function Page() {
  return <HistoryMapClient />
}
