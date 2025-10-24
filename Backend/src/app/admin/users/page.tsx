'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Eye, AlertTriangle, Users, UserCheck, UserX } from 'lucide-react';

// Función toast simple usando alert nativo
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`)
};

interface User {
  id: string;
  email: string;
  name: string;
  user_type: string;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  propertiesCount: number;
  favoritesCount: number;
}

interface UserWithStats extends User {
  stats?: UserStats;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filtrar y ordenar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.user_type === filterRole;
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    const aValue = a[sortBy as keyof User] || '';
    const bValue = b[sortBy as keyof User] || '';
    if (sortOrder === 'asc') {
      return aValue.toString().localeCompare(bValue.toString());
    }
    return bValue.toString().localeCompare(aValue.toString());
  });

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Error cargando usuarios');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Obtener detalles de un usuario
  const getUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/delete-user?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Error obteniendo detalles del usuario');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error obteniendo detalles del usuario');
      return null;
    }
  };

  // Eliminar usuario
  const deleteUser = async (userId: string) => {
    try {
      setDeleting(userId);
      
      const response = await fetch(`/api/admin/delete-user?userId=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error eliminando usuario');
      }

      toast.success(`Usuario ${data.deletedUser.email} eliminado exitosamente`);
      
      // Recargar la lista de usuarios
      await loadUsers();
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error eliminando usuario');
    } finally {
      setDeleting(null);
    }
  };

  // Mostrar detalles del usuario
  const showUserDetails = async (user: UserWithStats) => {
    const details = await getUserDetails(user.id);
    if (details) {
      setSelectedUser({
        ...user,
        stats: details.stats
      });
    }
  };

  // Confirmar eliminación
  const confirmDelete = (user: UserWithStats) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const getRoleBadgeColor = (userType: string) => {
    switch (userType) {
      case 'inmobiliaria':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'dueno':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inquilino':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600">
          Administra los usuarios de la plataforma
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.user_type === 'inquilino').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.user_type === 'inmobiliaria').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Moderadores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.user_type === 'dueno').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de búsqueda y filtros */}
      <div className="search-controls mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar por email o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="inmobiliaria">Inmobiliarias</SelectItem>
              <SelectItem value="inquilino">Inquilinos</SelectItem>
              <SelectItem value="dueno">Dueños</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Fecha de registro</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="updatedAt">Último acceso</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
        
        {/* Estadísticas */}
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Total: {users.length}</span>
          <span>Filtrados: {filteredUsers.length}</span>
          <span>Página {currentPage} de {totalPages}</span>
        </div>
      </div>

      {/* Lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Gestiona todos los usuarios registrados en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-900">Usuario</th>
                  <th className="text-left p-4 font-medium text-gray-900">Email</th>
                  <th className="text-left p-4 font-medium text-gray-900">Rol</th>
                  <th className="text-left p-4 font-medium text-gray-900">Registro</th>
                  <th className="text-left p-4 font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.name || 'Sin nombre'}
                        </p>
                        <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-900">{user.email}</p>
                    </td>
                    <td className="p-4">
                      <Badge className={getRoleBadgeColor(user.user_type)}>
                        {user.user_type}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showUserDetails(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user.user_type !== 'inmobiliaria' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmDelete(user)}
                            disabled={deleting === user.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleting === user.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay usuarios registrados</p>
            </div>
          )}

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="pagination-controls flex items-center justify-between mt-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Select 
                  value={currentPage.toString()} 
                  onValueChange={(value) => setCurrentPage(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <SelectItem key={page} value={page.toString()}>
                        {page}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalles del usuario */}
      {selectedUser && !showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle>Detalles del Usuario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Nombre</p>
                <p className="text-gray-900">{selectedUser.name || 'Sin nombre'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Rol</p>
                <Badge className={getRoleBadgeColor(selectedUser.user_type)}>
                  {selectedUser.user_type}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Registro</p>
                <p className="text-gray-900">{formatDate(selectedUser.created_at)}</p>
              </div>
              {selectedUser.stats && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Estadísticas</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Propiedades</p>
                      <p className="text-lg font-semibold">{selectedUser.stats.propertiesCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Favoritos</p>
                      <p className="text-lg font-semibold">{selectedUser.stats.favoritesCount}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                >
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="text-red-600">Confirmar Eliminación</CardTitle>
              <CardDescription>
                Esta acción no se puede deshacer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      ¿Estás seguro de eliminar este usuario?
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Usuario: <strong>{selectedUser.name || 'Sin nombre'}</strong></p>
                      <p>Email: <strong>{selectedUser.email}</strong></p>
                      <p className="mt-2">
                        Se eliminarán también todas sus propiedades, favoritos y datos relacionados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedUser(null);
                  }}
                  disabled={deleting === selectedUser.id}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteUser(selectedUser.id)}
                  disabled={deleting === selectedUser.id}
                >
                  {deleting === selectedUser.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Usuario
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
