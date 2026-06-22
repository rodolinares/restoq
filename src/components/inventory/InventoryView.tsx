import { useState } from 'react'
import { PackageOpen, Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { useInventoryStore } from '@/store/inventoryStore'
import type { Product, ProductCategory } from '@/types/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCard } from './ProductCard'
import { ProductFormDialog } from './ProductFormDialog'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'

const CATEGORIES: { value: ProductCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pantry', label: 'Pantry' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'pets', label: 'Pets' },
  { value: 'other', label: 'Other' }
]

export function InventoryView() {
  const products = useInventoryStore(s => s.products)
  const addProduct = useInventoryStore(s => s.addProduct)
  const updateProduct = useInventoryStore(s => s.updateProduct)
  const deleteProduct = useInventoryStore(s => s.deleteProduct)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | undefined>(undefined)
  const [deleting, setDeleting] = useState<Product | undefined>(undefined)

  const filtered = products.filter(p => {
    if (category !== 'all' && p.category !== category) return false
    if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleCreate = (data: Omit<Product, 'id' | 'createdAt'>) => {
    addProduct(data)
    toast(`${data.name} added`, { duration: 3000 })
  }

  const handleEdit = (data: Omit<Product, 'id' | 'createdAt'>) => {
    if (editing) {
      updateProduct(editing.id, data)
      toast(`${data.name} updated`, { duration: 3000 })
      setEditing(undefined)
    }
  }

  const handleDeleteConfirm = () => {
    if (deleting) {
      deleteProduct(deleting.id)
      toast(`${deleting.name} deleted`, { duration: 3000 })
      setDeleting(undefined)
    }
  }

  return (
    <>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <PackageOpen className="size-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No products yet</h2>
          <p className="max-w-64 text-sm text-muted-foreground">
            Add your first product to start tracking stock.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={
                  'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ' +
                  (category === c.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground')
                }
              >
                {c.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Search className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No products match your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Button
        type="button"
        size="icon"
        className="fixed bottom-20 right-4 z-40 size-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => setShowForm(true)}
      >
        <Plus className="size-6" />
      </Button>

      <ProductFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSave={handleCreate}
      />

      <ProductFormDialog
        open={!!editing}
        onOpenChange={open => !open && setEditing(undefined)}
        product={editing}
        onSave={handleEdit}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={open => !open && setDeleting(undefined)}
        itemName={deleting?.name ?? ''}
        detail={deleting ? `and all its snapshots & purchases` : ''}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
