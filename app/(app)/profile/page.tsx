'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Camera, User, Mail, Calendar, Award, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface UserProfile {
  id: number;
  userId: number;
  profilePhoto: string | null;
  joinDate: string;
  address: string | null;
  ssn: string | null;
  dateOfBirth: string | null;
  bankName: string | null;
  routingNumber: string | null;
  zelle: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    phone?: string;
    createdAt: string;
    userBadges: {
      badge: {
        id: number;
        name: string;
        icon: string;
        color: string;
      };
    }[];
  };
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    profilePhoto: '',
    address: '',
    ssn: '',
    dateOfBirth: '',
    bankName: '',
    routingNumber: '',
    zelle: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      setProfile(data);
      setFormData({
        profilePhoto: data.profilePhoto || '',
        address: data.address || '',
        ssn: data.ssn || '',
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
        bankName: data.bankName || '',
        routingNumber: data.routingNumber || '',
        zelle: data.zelle || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setEditing(false);
        fetchProfile();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, profilePhoto: data.url });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudo cargar el perfil</p>
      </div>
    );
  }

  const isAdmin = session?.user?.role === 'ADMIN';
  const isOwnProfile = profile.userId === parseInt(session?.user?.id || '0');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header del Perfil */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-start gap-6">
          {/* Foto de Perfil */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {profile.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt={profile.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            {isOwnProfile && editing && (
              <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Información Básica */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{profile.user.name}</h1>
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mb-4">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {profile.user.role}
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Miembro desde {new Date(profile.joinDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Medallas */}
            {profile.user.userBadges.length > 0 && (
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-medium">Medallas:</span>
                <div className="flex gap-2">
                  {profile.user.userBadges.map((ub) => (
                    <span
                      key={ub.badge.id}
                      title={ub.badge.name}
                      className="text-2xl"
                    >
                      {ub.badge.icon}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botón de Editar */}
          {isOwnProfile && !editing && (
            <Button onClick={() => setEditing(true)}>
              Editar Perfil
            </Button>
          )}
        </div>
      </div>

      {/* Información de Contacto */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Información de Contacto
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Email
            </label>
            <p className="mt-1">{profile.user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Teléfono
            </label>
            <p className="mt-1">{profile.user.phone || 'No especificado'}</p>
          </div>
        </div>
      </div>

      {/* Datos Sensibles (Solo Admin y Propio Usuario) */}
      {(isAdmin || isOwnProfile) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Información Privada
          </h2>

          {editing ? (
            <div className="space-y-4">
              <Input
                label="Dirección"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <Input
                label="Fecha de Nacimiento"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
              <Input
                label="SSN (Social Security Number)"
                value={formData.ssn}
                onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                placeholder="XXX-XX-XXXX"
              />
              <Input
                label="Nombre del Banco"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
              <Input
                label="Routing Number"
                value={formData.routingNumber}
                onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
              />
              <Input
                label="Zelle"
                value={formData.zelle}
                onChange={(e) => setFormData({ ...formData, zelle: e.target.value })}
              />

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    fetchProfile();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Dirección
                </label>
                <p className="mt-1">{profile.address || 'No especificada'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Fecha de Nacimiento
                </label>
                <p className="mt-1">
                  {profile.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString()
                    : 'No especificada'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  SSN
                </label>
                <p className="mt-1">{profile.ssn || 'No especificado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Banco
                </label>
                <p className="mt-1">{profile.bankName || 'No especificado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Routing Number
                </label>
                <p className="mt-1">{profile.routingNumber || 'No especificado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Zelle
                </label>
                <p className="mt-1">{profile.zelle || 'No especificado'}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
