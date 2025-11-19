"use client"

import { useState, useEffect } from "react"
import { FineCard } from "./fine-card"
import { FineForm } from "./fine-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import type { Fine } from "@/lib/types"

export function FinesList() {
  const [fines, setFines] = useState<Fine[]>([])
  const [filteredFines, setFilteredFines] = useState<Fine[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showDialog, setShowDialog] = useState(false)
  const [selectedFine, setSelectedFine] = useState<Fine | undefined>()

  useEffect(() => {
    fetchFines()
  }, [])

  useEffect(() => {
    filterFines()
  }, [fines, statusFilter])

  const fetchFines = async () => {
    try {
      const response = await fetch("/api/fines")
      const data = await response.json()
      setFines(data)
    } catch (error) {
      console.error("Error fetching fines:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterFines = () => {
    let filtered = fines

    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.status === statusFilter)
    }

    setFilteredFines(filtered)
  }

  const handleSubmit = async (data: Partial<Fine>) => {
    try {
      if (selectedFine) {
        await fetch(`/api/fines/${selectedFine.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      } else {
        await fetch("/api/fines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      }
      setShowDialog(false)
      setSelectedFine(undefined)
      fetchFines()
    } catch (error) {
      console.error("Error saving fine:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta multa?")) return

    try {
      await fetch(`/api/fines/${id}`, { method: "DELETE" })
      fetchFines()
    } catch (error) {
      console.error("Error deleting fine:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando multas...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="paid">Pagada</SelectItem>
            <SelectItem value="appealed">Recurrida</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => {
            setSelectedFine(undefined)
            setShowDialog(true)
          }}
          className="sm:ml-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar multa
        </Button>
      </div>

      {filteredFines.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No se encontraron multas</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFines.map((fine) => (
            <FineCard
              key={fine.id}
              fine={fine}
              onEdit={() => {
                setSelectedFine(fine)
                setShowDialog(true)
              }}
              onDelete={() => handleDelete(fine.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFine ? "Editar multa" : "Registrar multa"}</DialogTitle>
          </DialogHeader>
          <FineForm fine={selectedFine} onSubmit={handleSubmit} onCancel={() => setShowDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
