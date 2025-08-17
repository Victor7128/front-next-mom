"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  session_id: number;
  number: number;
  name: string | null;
  description: string | null;
};

export default function ProductoPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal para agregar producto
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);

  // Editar producto
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editing, setEditing] = useState(false);

  // Eliminar producto
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Listar productos
  const fetchProducts = () => {
    if (!sessionId) return;
    setLoading(true);
    fetch(`https://backend-web-mom-3dmj.shuttle.app/sessions/${sessionId}/products`)
      .then(r => r.json())
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };
  useEffect(fetchProducts, [sessionId]);

  // Abrir modal agregar
  const openAddModal = () => {
    setNewName("");
    setNewDescription("");
    setAddModalOpen(true);
  };

  // Crear producto
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() && !newDescription.trim()) return;
    setAdding(true);
    await fetch(`https://backend-web-mom-3dmj.shuttle.app/sessions/${sessionId}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim() ? newName : null,
        description: newDescription.trim() ? newDescription : null,
      }),
    });
    setNewName("");
    setNewDescription("");
    setAdding(false);
    setAddModalOpen(false);
    fetchProducts();
  };

  // Editar producto
  const openEditModal = (product: Product) => {
    setProductToEdit(product);
    setEditName(product.name ?? "");
    setEditDescription(product.description ?? "");
    setEditModalOpen(true);
  };
  const handleEditProduct = async () => {
    if (!productToEdit) return;
    setEditing(true);
    await fetch(`https://backend-web-mom-3dmj.shuttle.app/products/${productToEdit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim() ? editName : null,
        description: editDescription.trim() ? editDescription : null,
      }),
    });
    setEditing(false);
    setEditModalOpen(false);
    setProductToEdit(null);
    fetchProducts();
  };

  // Eliminar producto
  const openDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    await fetch(`https://backend-web-mom-3dmj.shuttle.app/products/${productToDelete.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    setDeleteModalOpen(false);
    setProductToDelete(null);
    fetchProducts();
  };

  return (
    <main className="min-h-screen bg-white py-8 px-4">
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Productos de la sesión
        </h1>
        <button
          className="bg-green-600 text-white rounded px-4 py-2 font-bold shadow hover:bg-green-700 transition cursor-pointer"
          onClick={openAddModal}
        >
          + Agregar nuevo producto
        </button>
      </div>

      {/* Lista de productos */}
      {loading ? (
        <div className="text-gray-500">Cargando productos...</div>
      ) : products.length === 0 ? (
        <div className="text-gray-500">No hay productos registrados en esta sesión.</div>
      ) : (
        <ul className="flex flex-col gap-2 max-w-2xl">
          {products.map(prod => (
            <li
              key={prod.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3 flex justify-between items-center"
            >
              <div>
                <span className="font-semibold text-gray-800">{prod.name || <i>Sin nombre</i>}</span>
                {prod.description && (
                  <div className="text-gray-600 text-sm">{prod.description}</div>
                )}
                <div className="text-xs text-gray-400"># {prod.number}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-bold cursor-pointer"
                  onClick={() => openEditModal(prod)}
                  title="Editar producto"
                >
                  Editar
                </button>
                <button
                  className="px-2 py-1 rounded bg-red-200 hover:bg-red-300 text-red-900 font-bold cursor-pointer"
                  onClick={() => openDeleteModal(prod)}
                  title="Eliminar producto"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de agregar producto */}
      {addModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50" onClick={() => setAddModalOpen(false)}>
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[300px] flex flex-col gap-4 max-w-[90vw]"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-green-700">Agregar nuevo producto</h2>
            <form className="flex flex-col gap-3" onSubmit={handleAddProduct}>
              <input
                type="text"
                className="border border-gray-300 rounded px-3 py-2 w-full"
                placeholder="Nombre del producto (opcional)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                disabled={adding}
                autoFocus
              />
              <input
                type="text"
                className="border border-gray-300 rounded px-3 py-2 w-full"
                placeholder="Descripción (opcional)"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                disabled={adding}
              />
              <div className="flex gap-2 justify-end mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                  onClick={() => setAddModalOpen(false)}
                  disabled={adding}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white font-bold cursor-pointer"
                  disabled={adding || (!newName.trim() && !newDescription.trim())}
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {editModalOpen && productToEdit && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50" onClick={() => setEditModalOpen(false)}>
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[300px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-yellow-700">Editar producto</h2>
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-2 w-full"
              placeholder="Nombre del producto"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              disabled={editing}
            />
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-2 w-full"
              placeholder="Descripción"
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              disabled={editing}
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                onClick={() => setEditModalOpen(false)}
                disabled={editing}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-yellow-600 text-white font-bold cursor-pointer"
                onClick={handleEditProduct}
                disabled={editing}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50" onClick={() => setDeleteModalOpen(false)}>
          <div
            className="bg-white rounded-xl p-6 shadow-xl min-w-[300px] flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2 text-red-700">Eliminar producto</h2>
            <div className="text-gray-800">
              ¿Estás seguro de que deseas eliminar el producto <b>{productToDelete.name || "sin nombre"}</b>?
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 cursor-pointer"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-bold cursor-pointer"
                onClick={handleDeleteProduct}
                disabled={deleting}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}