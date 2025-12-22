"use client"

import dynamic from "next/dynamic"

const AdminMapClient = dynamic(() => import("./admin-map-client"), { ssr: false })

export default function LocalizacionClient() {
  return <AdminMapClient />
}
