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
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${sessionId}/products`)
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${sessionId}/products`, {
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${productToEdit.id}`, {
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
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/products/${productToDelete.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    setDeleteModalOpen(false);
    setProductToDelete(null);
    fetchProducts();
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4 py-10">
      <div className="w-full max-w-2xl mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-indigo-700">
          Productos de la sesión
        </h1>
        <button
          className="bg-green-600 text-white rounded-full px-6 py-2 font-semibold shadow hover:bg-green-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 active:scale-95"
          onClick={openAddModal}
        >
          + Agregar nuevo producto
        </button>
      </div>

      {/* Lista de productos */}
      <div className="w-full max-w-2xl">
        {loading ? (
          <div className="text-gray-500 text-lg text-center py-8">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="text-gray-500 text-lg text-center py-8">No hay productos registrados en esta sesión.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {products.map(prod => (
              <li
                key={prod.id}
                className="bg-white/90 border border-indigo-200 rounded-2xl shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 transition-all hover:shadow-lg hover:bg-indigo-50 hover:border-indigo-400"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-indigo-900 text-lg">{prod.name || <i>Sin nombre</i>}</span>
                  {prod.description && (
                    <div className="text-gray-700 text-base mt-1 break-words">{prod.description}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-2"># {prod.number}</div>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <button
                    className="px-4 py-2 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-900 font-semibold shadow-sm transition"
                    onClick={() => openEditModal(prod)}
                    title="Editar producto"
                  >
                    Editar
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 font-semibold shadow-sm transition"
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
      </div>

      {/* Modal de agregar producto */}
      {addModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50" onClick={() => setAddModalOpen(false)}>
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-green-700 text-center">Agregar nuevo producto</h2>
            <form className="flex flex-col gap-3" onSubmit={handleAddProduct}>
              <input
                type="text"
                className="border border-green-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                placeholder="Nombre del producto (opcional)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                disabled={adding}
                autoFocus
              />
              <input
                type="text"
                className="border border-green-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                placeholder="Descripción (opcional)"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                disabled={adding}
              />
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                  onClick={() => setAddModalOpen(false)}
                  disabled={adding}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition disabled:bg-green-400"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50" onClick={() => setEditModalOpen(false)}>
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-yellow-700 text-center">Editar producto</h2>
            <input
              type="text"
              className="border border-yellow-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
              placeholder="Nombre del producto"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              disabled={editing}
              autoFocus
            />
            <input
              type="text"
              className="border border-yellow-200 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
              placeholder="Descripción"
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              disabled={editing}
            />
            <div className="flex gap-3 justify-end mt-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                onClick={() => setEditModalOpen(false)}
                disabled={editing}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-bold transition disabled:bg-yellow-400"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50" onClick={() => setDeleteModalOpen(false)}>
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl min-w-[320px] w-full max-w-xs flex flex-col gap-5 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-red-700 text-center">Eliminar producto</h2>
            <div className="text-gray-800 text-center">
              ¿Estás seguro de que deseas eliminar el producto <b>{productToDelete.name || "sin nombre"}</b>?
            </div>
            <div className="flex gap-3 justify-end mt-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:bg-red-400"
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