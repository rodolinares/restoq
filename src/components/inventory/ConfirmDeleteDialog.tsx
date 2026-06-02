import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  detail?: string
  onConfirm: () => void
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  itemName,
  detail,
  onConfirm
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove record?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will remove <strong>{itemName}</strong>
          {detail ? <> ({detail})</> : ''} from your purchase history.
        </p>
        <div className="flex gap-3 pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="flex-1">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" className="flex-1" onClick={onConfirm}>
            Remove
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
