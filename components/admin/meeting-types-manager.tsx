'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useLanguage } from '@/lib/i18n/language-context'
import { createMeetingType, updateMeetingType, deleteMeetingType } from '@/app/actions/scheduling'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
import type { MeetingType } from '@/lib/db/schema'

interface MeetingTypesManagerProps {
  meetingTypes: MeetingType[]
}

const COLOR_OPTIONS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

export function MeetingTypesManager({ meetingTypes }: MeetingTypesManagerProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<MeetingType | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(30)
  const [color, setColor] = useState(COLOR_OPTIONS[0])

  const resetForm = () => {
    setName('')
    setDescription('')
    setDuration(30)
    setColor(COLOR_OPTIONS[0])
    setEditingType(null)
  }

  const openEditDialog = (type: MeetingType) => {
    setEditingType(type)
    setName(type.name)
    setDescription(type.description || '')
    setDuration(type.duration)
    setColor(type.color)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (editingType) {
        await updateMeetingType(editingType.id, { name, description, duration, color })
      } else {
        await createMeetingType({ name, description, duration, color })
      }
      setDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save meeting type')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (type: MeetingType) => {
    try {
      await updateMeetingType(type.id, { isActive: !type.isActive })
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update meeting type')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(language === 'es' ? 'Estas seguro de que quieres eliminar este tipo de cita?' : 'Are you sure you want to delete this meeting type?')) return
    try {
      await deleteMeetingType(id)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete meeting type')
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t.admin.meetingTypes}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === 'es' ? 'Define diferentes tipos de citas que los clientes pueden reservar' : 'Define different types of meetings clients can book'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t.admin.addMeetingType}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? (language === 'es' ? 'Editar Tipo de Cita' : 'Edit Meeting Type') : t.admin.addMeetingType}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">{t.admin.name}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.admin.namePlaceholder}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">{t.admin.description}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.admin.descriptionPlaceholder}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="duration">{t.admin.duration}</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={480}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{t.admin.color}</Label>
                <div className="flex gap-2 mt-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        color === c ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={loading || !name} className="w-full">
                {loading ? t.admin.saving : editingType ? t.common.save : t.admin.add}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {meetingTypes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t.admin.noMeetingTypes}</p>
          <p className="text-sm">{t.admin.noMeetingTypesDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetingTypes.map((type) => (
            <div
              key={type.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                type.isActive ? 'border-border' : 'border-muted bg-muted/30 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: type.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{type.name}</span>
                    <span className="text-sm text-muted-foreground">({type.duration} min)</span>
                  </div>
                  {type.description && (
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-xs text-muted-foreground">{t.admin.active}</span>
                  <Switch
                    checked={type.isActive}
                    onCheckedChange={() => handleToggleActive(type)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(type)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(type.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
